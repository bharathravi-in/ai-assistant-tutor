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

    # 4. Construct Deterministic Lesson Renderer Prompt
    lang_name = {
        "en": "English",
        "hi": "Hindi",
        "ta": "Tamil",
        "te": "Telugu",
        "kn": "Kannada",
        "mr": "Marathi"
    }.get(request.language, "English")

    system_prompt = f"""You are 'Pathshala Guru'. Professional, encouraging, and instructional.

LANGUAGE RULES:
1. Always respond in the language provided in the METADATA ({lang_name}).
2. If the user explicitly asks for another language (e.g., "explain in Hindi"), immediately switch to that language for the response.
3. Do not ask for confirmation.
4. Do not mix languages (except for literal keys: SECTION_ID, etc.).
5. Maintain the selected language for all future responses until the metadata or user says otherwise.

RESPONSE CONTRACT (FORMATTING):
- These literal keys MUST remain in English/Uppercase: SECTION_ID:, SECTION_TYPE:, SECTION_TITLE:, SECTION_CONTENT:
- The values for ID and TYPE must match the metadata exactly.
- ONLY the actual content under SECTION_CONTENT and the greeting (if any) should be in the target language.

You MUST respond in this EXACT structured format:
SECTION_ID: [id provided in metadata]
SECTION_TYPE: [type provided in metadata]
SECTION_TITLE: [title provided in metadata]

SECTION_CONTENT:
[Your classroom-ready explanation or activity instructions for THIS section only. Keep it 2-4 sentences.]
Respond ENTIRELY in the target language, except for the literal keys specified above.
"""

    lesson_metadata = f"""
CURRENT_SECTION METADATA:
- id: {active_sec.get('id') if active_sec else request.active_section_id}
- type: {active_sec.get('type') if active_sec else 'explanation'}
- title: {active_sec.get('title') if active_sec else request.active_section_id.replace('_', ' ').title()}
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


@router.post("/process-pdf/{content_id}")
async def process_pdf_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Process a PDF file and convert it into interactive Guru sections.
    """
    # 1. Fetch content
    content = await db.get(TeacherContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if not content.pdf_url:
        raise HTTPException(status_code=400, detail="This content has no PDF to process")

    # 2. Fetch system settings
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    orchestrator = AIOrchestrator(system_settings=system_settings)

    # 3. Determine PDF path (handle both remote URLs and local paths)
    # For now, we assume local uploads/ storage. If it's a URL, we might need to download it.
    pdf_path = content.pdf_url
    if pdf_path.startswith("http"):
        # In a real app, download to temp if not accessible by path
        # For this demo, we assume the path is relative to the app root or in uploads/
        pass

    try:
        # 4. Convert PDF to sections using Gemini
        sections = await orchestrator.process_pdf_to_sections(pdf_path)
        
        if not sections:
             raise HTTPException(status_code=500, detail="Gemini failed to extract sections from PDF")

        # 5. Update content object
        if not content.content_json:
            content.content_json = {}
        
        content.content_json["sections"] = sections
        db.add(content)
        await db.commit()

        return {
            "message": "PDF processed successfully",
            "sections_count": len(sections),
            "content_id": content_id
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF processing error: {str(e)}")
