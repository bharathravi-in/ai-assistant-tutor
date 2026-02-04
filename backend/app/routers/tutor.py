"""
AI Tutor Interaction Router
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
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
        
    # 2. Extract section context
    section_context = ""
    active_sec = None
    if content.content_json and "sections" in content.content_json:
        sections = content.content_json["sections"]
        active_sec = next((s for s in sections if s.get('id') == request.active_section_id), None)
        if active_sec:
            section_context = f"Current Section: {active_sec.get('title')}\nContent: {active_sec.get('content')}"
    
    # If no sequential sections found, fallback to legacy keys
    if not section_context and content.content_json:
        val = content.content_json.get(request.active_section_id)
        if val:
            section_context = f"Context: {str(val)}"

    # 3. Fetch system settings
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    orchestrator = AIOrchestrator(system_settings=system_settings)

    # 4. Construct STRICT Context-Bound System Prompt
    lang_name = {
        "en": "English",
        "hi": "Hindi",
        "ta": "Tamil",
        "te": "Telugu",
        "kn": "Kannada",
        "mr": "Marathi"
    }.get(request.language, "English")

    section_title = active_sec.get('title') if active_sec else request.active_section_id.replace('_', ' ').title()
    section_type = active_sec.get('type') if active_sec else 'explanation'

    system_prompt = f"""You are Pathshala AI Teaching Assistant.

YOU ARE STRICTLY CONTEXT-BOUND.

HARD RULES (MUST FOLLOW - NON-NEGOTIABLE):
1. You can ONLY answer questions related to the CURRENT LESSON CONTEXT below.
2. If a question is OUTSIDE the current lesson or section, you MUST refuse politely using the exact refusal message.
3. You MUST answer ONLY in {lang_name}. This is NON-NEGOTIABLE.
4. You MUST NOT switch language unless the user EXPLICITLY asks to change language.
5. You MUST reference the current section in your answer.
6. You are NOT a general chatbot. You are a lesson-bound teaching assistant.

OFF-TOPIC REFUSAL RULE:
If the user asks about topics NOT in the CURRENT TEACHING CONTEXT (e.g., Newton's Laws during a Water Cycle lesson), respond EXACTLY with:
"This question is outside the current lesson. Let's continue with {section_title}."
(Translate this refusal message to {lang_name} if needed)

LANGUAGE RULE:
- Selected Language: {lang_name}
- ALL responses MUST be in {lang_name} ONLY.
- Do NOT mix languages.
- Do NOT switch languages unless the user explicitly requests it.

CURRENT TEACHING CONTEXT (AUTHORITATIVE - this is the ONLY topic you may discuss):
- Class: Grade {content.grade if content.grade else 'N/A'}
- Subject: {content.subject if content.subject else 'General'}
- Lesson Title: {content.title}
- Section Title: {section_title}
- Section Type: {section_type}
- Topic: {content.topic if content.topic else section_title}

CURRENT SECTION CONTENT:
{section_context}

OUTPUT STYLE:
- Teacher-friendly, classroom-ready language
- Simple and encouraging tone
- 4-6 lines maximum
- Use bullet points if steps are involved

REMEMBER: You are NOT a general AI. You are lesson-bound. Refuse anything outside the current context."""

    lesson_metadata = f"""
CURRENT_SECTION METADATA:
- id: {active_sec.get('id') if active_sec else request.active_section_id}
- type: {section_type}
- title: {section_title}
- index: {request.section_index}
"""

    section_details = f"""
CONTENT TO RENDER:
{section_context}
"""

    prompt = f"{system_prompt}\n{lesson_metadata}\n{section_details}\nUSER MESSAGE: {request.user_message}\n\nResponse:"


    try:
        answer = await orchestrator.get_simple_answer(prompt, language=request.language)
        return {
            "answer": answer,
            "section_id": active_sec.get('id') if active_sec else request.active_section_id,
            "content_id": request.content_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor chat error: {str(e)}")


async def _process_pdf_background(
    content_id: int,
    db_session_factory,
    pdf_url: str
):
    """Background task to process PDF into sections."""
    from app.services.ai_orchestrator import AIOrchestrator
    from app.models.system_settings import SystemSettings
    from app.models.teacher_content import TeacherContent, ContentStatus
    from sqlalchemy import select
    import httpx
    import tempfile
    import os
    import traceback

    async with db_session_factory() as db:
        try:
            # 1. Fetch content
            content = await db.get(TeacherContent, content_id)
            if not content:
                print(f"[Tutor-BG] Content {content_id} not found")
                return

            # 2. Fetch system settings
            system_settings = await db.scalar(select(SystemSettings).limit(1))
            orchestrator = AIOrchestrator(system_settings=system_settings)

            # 3. Download/Prepare PDF
            pdf_path = pdf_url
            temp_file_path = None
            
            if pdf_path.startswith("http"):
                print(f"[Tutor-BG] Downloading PDF: {pdf_path}")
                async with httpx.AsyncClient() as client:
                    response = await client.get(pdf_path, timeout=60.0)
                    if response.status_code == 200:
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                            tmp.write(response.content)
                            temp_file_path = tmp.name
                            pdf_path = temp_file_path
            
            # 4. Process using AI
            print(f"[Tutor-BG] Extracting sections via {orchestrator.llm_client.provider}...")
            sections = await orchestrator.process_pdf_to_sections(pdf_path)
            
            if sections:
                if not content.content_json:
                    content.content_json = {}
                content.content_json["sections"] = sections
                content.status = ContentStatus.PUBLISHED # Re-publish after processing
                print(f"[Tutor-BG] Success! {len(sections)} sections extracted for content {content_id}")
            else:
                print(f"[Tutor-BG] Error: AI provider failed to extract sections")
                content.status = ContentStatus.PUBLISHED # Re-publish even on failure so it's not stuck
                if not content.content_json:
                    content.content_json = {}
                content.content_json["error"] = "AI failed to extract sections from this PDF."

            db.add(content)
            await db.commit()

        except Exception as e:
            print(f"[Tutor-BG] Critical error: {str(e)}")
            traceback.print_exc()
            # Try to reset status so it's not stuck in 'processing'
            try:
                content = await db.get(TeacherContent, content_id)
                if content:
                    content.status = ContentStatus.PUBLISHED
                    db.add(content)
                    await db.commit()
            except: pass
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try: os.unlink(temp_file_path)
                except: pass


@router.post("/process-pdf/{content_id}")
async def process_pdf_content(
    content_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Process a PDF file and convert it into interactive Guru sections (Background Task).
    """
    from app.database import async_session_maker
    from app.models.teacher_content import ContentStatus

    # 1. Fetch content
    content = await db.get(TeacherContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if not content.pdf_url:
        raise HTTPException(status_code=400, detail="This content has no PDF to process")

    # 1.5 Prevent redundant background tasks
    if content.status == ContentStatus.PROCESSING:
        print(f"[Tutor] Skipping PDF process request for {content_id} - already in progress")
        return {
            "message": "PDF processing is already in progress",
            "status": "processing",
            "content_id": content_id
        }

    # 2. Update status to processing
    content.status = ContentStatus.PROCESSING
    db.add(content)
    await db.commit()

    # 3. Queue background task
    background_tasks.add_task(
        _process_pdf_background,
        content_id=content_id,
        db_session_factory=async_session_maker,
        pdf_url=content.pdf_url
    )

    return {
        "message": "PDF processing started in background",
        "status": "processing",
        "content_id": content_id
    }

