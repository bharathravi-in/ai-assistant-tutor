"""
AI Tutor Interaction Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.teacher_content import TeacherContent
from app.models.system_settings import SystemSettings
from app.schemas.ai import TutorChatRequest
from app.routers.auth import get_current_user
from app.services.ai_orchestrator import AIOrchestrator

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])

@router.post("/chat")
async def tutor_chat(
    request: TutorChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Context-aware AI Tutor chat.
    Answers questions specifically based on the current section being viewed.
    """
    # 1. Fetch content
    content = await db.get(TeacherContent, request.content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # 2. Extract section context (Prioritize request-provided content)
    section_context = request.active_section_content or ""
    active_sec = None
    
    # Fallback to database if no content provided in request
    if not section_context and content.content_json and "sections" in content.content_json:
        sections = content.content_json["sections"]
        active_sec = next((s for s in sections if s.get('id') == request.active_section_id), None)
        if active_sec:
            section_context = active_sec.get('content', '')

    # 3. Fetch system & organization settings
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    org_settings = None
    if current_user.organization_id:
        from app.models.organization_settings import OrganizationSettings
        org_settings = await db.scalar(
            select(OrganizationSettings).where(OrganizationSettings.organization_id == current_user.organization_id)
        )
        
    orchestrator = AIOrchestrator(
        organization_settings=org_settings,
        system_settings=system_settings
    )

    # 3. Construct Educator Persona Prompt
    lang_name = {
        "en": "English",
        "hi": "Hindi",
        "ta": "Tamil",
        "te": "Telugu",
        "kn": "Kannada",
        "mr": "Marathi"
    }.get(request.language, "English")

    section_title = active_sec.get('title') if active_sec else request.active_section_id.replace('_', ' ').title()

    system_prompt = f"""You are Pathshala AI, a supportive and professional teacher's assistant. Your mission is to help teachers explain the current lesson clearly to their students.

CORE IDENTITY & TONE:
- You are a warm, encouraging educator.
- You speak fluently in {lang_name}. You are the dedicated {lang_name} Teaching Assistant for this classroom.
- LANGUAGE LOCK: You MUST respond ONLY in {lang_name}. NEVER ask to switch to English. NEVER mention that you are an "English Assistant" or that you have "limitations" in {lang_name}.
- YOUR ROLE: Your job is to TEACH the English content provided below using clear, natural {lang_name}.

TEACHING RULES (STRICT):
1. ASSIST, DON'T DUPLICATE: Never re-state the verbatim content from the "CURRENT SECTION CONTENT". Instead, explain it simply, provide new local examples, or answer questions—all in {lang_name}.
2. BREVITY: Never write more than 6 brief bullet points or 6 short lines.
3. SIMPLICITY: Use simple analogies relevant to Indian students (Class 6 level).
4. CONTEXT: Stay focused on the current section being viewed.

HOW TO REFUSE OFF-TOPIC QUERIES:
If a user asks something completely unrelated to the lesson, reply concisely in {lang_name} that you are here to help with {section_title}.

CURRENT LESSON CONTEXT:
- Lesson: {content.title}
- Section: {section_title}
- Target Language: {lang_name} (MANDATORY)

CURRENT SECTION CONTENT:
{section_context}

Think like a veteran {lang_name} teacher. Be concise, be clear, and respect the learner's language choice as a hard requirement."""

    # 4. Format chat history for the prompt
    history_text = ""
    if request.history:
        for msg in request.history:
            role = "CO-TEACHER" if msg.get('role') == 'assistant' or msg.get('role') == 'tutor' else "TEACHER"
            content_text = msg.get('content', '')
            history_text += f"{role}: {content_text}\n"

    prompt = f"{system_prompt}\n\nHISTORY:\n{history_text if history_text else 'No previous conversation.'}\n\nTEACHER QUESTION: {request.user_message}\n\nCO-TEACHER RESPONSE:"


    try:
        answer = await orchestrator.get_simple_answer(prompt, language=request.language)
        return {
            "answer": answer,
            "section_id": active_sec.get('id') if active_sec else request.active_section_id,
            "content_id": request.content_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor chat error: {str(e)}")


@router.post("/process-pdf/{content_id}")
async def process_pdf_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Process a PDF file and convert it into interactive Guru sections synchronously.
    """
    from app.models.teacher_content import ContentStatus
    from app.services.ai_orchestrator import AIOrchestrator
    from app.models.system_settings import SystemSettings
    import httpx
    import tempfile
    import os
    import traceback

    # 1. Fetch content
    content = await db.get(TeacherContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if not content.pdf_url:
        raise HTTPException(status_code=400, detail="This content has no PDF to process")

    # Prevent redundant processing if already published with sections
    if content.content_json and "sections" in content.content_json and len(content.content_json["sections"]) > 0:
        return {
            "message": "Content already has processed sections",
            "status": "published",
            "sections": content.content_json["sections"]
        }

    # 2. Update status to processing
    content.status = ContentStatus.PROCESSING
    db.add(content)
    await db.commit()

    temp_file_path = None
    try:
        # 3. Fetch system settings & Init Orchestrator
        system_settings = await db.scalar(select(SystemSettings).limit(1))
        orchestrator = AIOrchestrator(system_settings=system_settings)

        # 4. Download PDF
        pdf_path = content.pdf_url
        if pdf_path.startswith("http"):
            print(f"[Tutor] Sync downloading PDF: {pdf_path}")
            async with httpx.AsyncClient() as client:
                response = await client.get(pdf_path, timeout=60.0)
                if response.status_code == 200:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                        tmp.write(response.content)
                        temp_file_path = tmp.name
                        pdf_path = temp_file_path
                else:
                    raise Exception(f"Failed to download PDF: {response.status_code}")
        
        # 5. Process using AI (This is where the resource analysis happens)
        print(f"[Tutor] Sync extracting sections via {orchestrator.llm_client.provider}...")
        
        # Call the resource analyzer function, passing system_settings
        analysis = await analyze_resource(
            resource_id=content.id,
            title=content.title,
            content_url=content.pdf_url,
            category=content.category,
            grade=content.grade,
            subject=content.subject,
            system_settings=system_settings,
            pdf_local_path=pdf_path # Pass the local path of the downloaded PDF
        )
        
        sections = analysis.get("sections") # Assuming analyze_resource returns a dict with 'sections'

        if sections:
            if not content.content_json:
                content.content_json = {}
            content.content_json["sections"] = sections
            content.content_json.pop("error", None)  # Clear any previous error
            content.status = ContentStatus.PUBLISHED
            print(f"[Tutor] Success! {len(sections)} sections extracted for content {content_id}")
        else:
            print(f"[Tutor] Error: AI provider failed to extract sections")
            content.status = ContentStatus.PUBLISHED # Reset so it's not stuck
            if not content.content_json:
                content.content_json = {}
            content.content_json["error"] = "Unable to extract learning sections from this PDF. The document may be image-based or have complex formatting. Please try a different PDF."
            content.content_json["sections"] = []  # Ensure empty array

        db.add(content)
        await db.commit()
        await db.refresh(content)

        return {
            "message": "PDF processing complete",
            "status": "published",
            "sections": sections if sections else [],
            "content_id": content_id,
            "error": content.content_json.get("error") if not sections else None
        }

    except Exception as e:
        print(f"[Tutor] Critical processing error: {str(e)}")
        traceback.print_exc()
        # Reset status so it's not stuck in 'processing'
        content.status = ContentStatus.PUBLISHED
        db.add(content)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")
    
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try: os.unlink(temp_file_path)
            except: pass

