"""
AI Interaction Router
"""
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.query import Query, QueryMode
from app.models.system_settings import SystemSettings
from app.schemas.ai import (
    AIRequest, AIResponse, QuizRequest, QuizResponse,
    TLMRequest, TLMResponse, AuditRequest, AuditResponse
)
from app.routers.auth import get_current_user
from app.services.ai_orchestrator import AIOrchestrator
from sqlalchemy import select

router = APIRouter(prefix="/ai", tags=["AI"])


def classify_query_type(input_text: str, mode: str, subject: str = None, topic: str = None) -> str:
    """
    Classify a query as 'topic_based' (curriculum/subject related) or 'general' (classroom management, admin).
    Uses keyword matching for fast classification without additional LLM calls.
    """
    text_lower = input_text.lower()
    
    # If subject or topic is explicitly provided, it's topic-based
    if subject or topic:
        return "topic_based"
    
    # If mode is 'explain' or 'plan', it's likely topic-based
    if mode in ['explain', 'EXPLAIN', 'plan', 'PLAN']:
        return "topic_based"
    
    # Topic-based keywords (curriculum, subjects, concepts)
    topic_keywords = [
        # Math
        'math', 'mathematics', 'fraction', 'fractions', 'decimal', 'algebra', 'geometry',
        'equation', 'multiplication', 'division', 'addition', 'subtraction', 'percentage',
        'number', 'numbers', 'counting', 'arithmetic', 'calculus', 'trigonometry',
        # Science
        'science', 'physics', 'chemistry', 'biology', 'photosynthesis', 'ecosystem',
        'atom', 'molecule', 'cell', 'plant', 'animal', 'human body', 'solar system',
        'gravity', 'force', 'energy', 'electricity', 'magnet', 'water cycle',
        # Languages
        'grammar', 'noun', 'verb', 'pronoun', 'sentence', 'essay', 'poem', 'poetry',
        'reading', 'writing', 'comprehension', 'vocabulary', 'spelling', 'hindi', 'english',
        # Social Studies
        'history', 'geography', 'civics', 'constitution', 'democracy', 'freedom struggle',
        'map', 'continent', 'country', 'river', 'mountain', 'climate',
        # Other subjects
        'computer', 'programming', 'art', 'music', 'environment', 'evs',
        # Educational terms
        'teach', 'explain', 'concept', 'topic', 'lesson', 'chapter', 'class ', 'grade ',
        'ncert', 'textbook', 'syllabus', 'curriculum', 'learning objective'
    ]
    
    # General/classroom management keywords
    general_keywords = [
        'classroom management', 'discipline', 'behavior', 'behaviour', 'noisy',
        'distraction', 'attention', 'parent meeting', 'parents', 'attendance',
        'seating arrangement', 'motivation', 'engage', 'bored students',
        'slow learner', 'special needs', 'inclusion', 'assessment strategy',
        'grading', 'feedback', 'communication', 'conflict', 'bullying',
        'time management', 'schedule', 'homework', 'assignment'
    ]
    
    # Check for topic keywords first (they're more specific to curriculum)
    for keyword in topic_keywords:
        if keyword in text_lower:
            return "topic_based"
    
    # Check for general keywords
    for keyword in general_keywords:
        if keyword in text_lower:
            return "general"
    
    # Default to topic_based if uncertain (better to show more options)
    return "topic_based"


@router.post("/ask", response_model=dict)
async def ask_ai(
    request: AIRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Main AI endpoint - routes to appropriate mode.
    Modes: explain, assist, plan
    """
    start_time = time.time()
    
    # Fetch global AI settings first
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    
    # Create orchestrator and get response
    orchestrator = AIOrchestrator(system_settings=system_settings)
    
    try:
        response = await orchestrator.process_request(
            mode=request.mode,
            input_text=request.input_text,
            language=request.language,
            grade=request.grade,
            subject=request.subject,
            topic=request.topic,
            context=request.context,
            media_path=request.media_path,
            is_multigrade=request.is_multigrade,
            class_size=request.class_size,
            instructional_time_minutes=request.instructional_time_minutes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")
    
    processing_time = int((time.time() - start_time) * 1000)
    
    # Store query in database
    query = Query(
        user_id=current_user.id,
        mode=request.mode,
        input_text=request.input_text,
        input_language=request.language,
        grade=request.grade,
        subject=request.subject,
        topic=request.topic,
        is_multigrade=request.is_multigrade,
        class_size=request.class_size,
        instructional_time_minutes=request.instructional_time_minutes,
        ai_response=response.get("content"),
        response_language=request.language,
        processing_time_ms=processing_time,
    )
    
    db.add(query)
    await db.commit()
    await db.refresh(query)
    
    # If teacher wants to share with CRP, create a QueryShare record
    if request.share_with_crp:
        from app.models.feedback import QueryShare
        query_share = QueryShare(
            query_id=query.id,
            shared_with_id=None,  # Will be visible to all CRPs in district
            is_reviewed=False
        )
        db.add(query_share)
        await db.commit()
    
    # Classify the query type
    query_type = classify_query_type(
        input_text=request.input_text,
        mode=request.mode.value if hasattr(request.mode, 'value') else str(request.mode),
        subject=request.subject,
        topic=request.topic
    )
    
    return {
        "query_id": query.id,
        "mode": request.mode.value,
        "language": request.language,
        "content": response.get("content"),
        "structured": response.get("structured"),
        "processing_time_ms": processing_time,
        "suggestions": response.get("suggestions", []),
        "shared_with_crp": request.share_with_crp,
        "query_type": query_type,  # "topic_based" or "general"
        "query": {
            "id": query.id,
            "user_id": query.user_id,
            "mode": query.mode,
            "input_text": query.input_text,
            "input_language": query.input_language,
            "grade": query.grade,
            "subject": query.subject,
            "topic": query.topic,
            "ai_response": query.ai_response,
            "response_language": query.response_language,
            "processing_time_ms": query.processing_time_ms,
            "is_resolved": query.is_resolved,
            "requires_crp_review": query.requires_crp_review,
            "created_at": query.created_at.isoformat() if query.created_at else None,
            "responded_at": query.responded_at.isoformat() if query.responded_at else None,
        }
    }


from pydantic import BaseModel
from typing import Optional as Opt

class AnswerQuestionRequest(BaseModel):
    question: str
    topic: Opt[str] = None
    grade: Opt[int] = None
    language: str = "en"

@router.post("/answer-question")
async def answer_question(
    request: AnswerQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Simple endpoint to answer a specific question directly.
    Returns just the answer text, not a full structured teaching response.
    Used for "Check for Understanding" questions and similar use cases.
    """
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    orchestrator = AIOrchestrator(system_settings=system_settings)
    
    # Language instruction for non-English
    language_instruction = ""
    if request.language and request.language != "en":
        language_map = {
            "hi": "Hindi",
            "kn": "Kannada", 
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi",
            "gu": "Gujarati",
            "bn": "Bengali",
            "pa": "Punjabi"
        }
        lang_name = language_map.get(request.language, request.language)
        language_instruction = f"\nIMPORTANT: Respond in {lang_name} language."
    
    # Build a focused prompt for just answering the question
    prompt = f"""You are a helpful teaching assistant. Answer the following question clearly and concisely.
Keep your answer brief, focused, and easy to understand.
Do NOT provide additional sections, examples, or teaching materials - just answer the question directly.{language_instruction}

Question: {request.question}
{"Topic Context: " + request.topic if request.topic else ""}
{"Grade Level: Class " + str(request.grade) if request.grade else ""}

Provide a direct, clear answer in 2-4 sentences:"""

    try:
        # Get a simple response - we'll use the orchestrator's direct LLM call
        answer = await orchestrator.get_simple_answer(prompt, language=request.language)
        
        return {
            "question": request.question,
            "answer": answer,
            "topic": request.topic,
            "grade": request.grade,
            "language": request.language
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")



@router.post("/explain")
async def explain_concept(
    input_text: str,
    language: str = "en",
    grade: int = None,
    subject: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mode 1: Explain how to teach a concept."""
    request = AIRequest(
        mode=QueryMode.EXPLAIN,
        input_text=input_text,
        language=language,
        grade=grade,
        subject=subject,
    )
    return await ask_ai(request, current_user, db)


@router.post("/assist")
async def classroom_assist(
    input_text: str,
    language: str = "en",
    context: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mode 2: Get immediate classroom management help."""
    request = AIRequest(
        mode=QueryMode.ASSIST,
        input_text=input_text,
        language=language,
        context=context,
    )
    return await ask_ai(request, current_user, db)


@router.post("/plan")
async def plan_lesson(
    input_text: str,
    language: str = "en",
    grade: int = None,
    subject: str = None,
    topic: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mode 3: Generate a lesson plan."""
    request = AIRequest(
        mode=QueryMode.PLAN,
        input_text=input_text,
        language=language,
        grade=grade,
        subject=subject,
        topic=topic,
    )
    return await ask_ai(request, current_user, db)


@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mode 4: Generate a quiz based on specific lesson content.
    """
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    orchestrator = AIOrchestrator(system_settings=system_settings)
    
    try:
        quiz = await orchestrator.generate_quiz(
            topic=request.topic,
            content=request.content,
            language=request.language,
            level=request.level
        )
        
        # If the LLM failed to return valid JSON, the orchestrator returns raw_response
        if isinstance(quiz, dict) and "raw_response" in quiz:
             raise HTTPException(status_code=500, detail="Failed to generate a structured quiz. Please try again.")
             
        if not quiz or not quiz.get("questions"):
             raise HTTPException(status_code=500, detail="No questions were generated. Please try again.")
             
        return quiz
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")


@router.post("/generate-tlm", response_model=TLMResponse)
async def generate_tlm(
    request: TLMRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mode 5: Generate TLM (Visual/Physical) based on specific lesson content.
    """
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    orchestrator = AIOrchestrator(system_settings=system_settings)
    
    try:
        tlm = await orchestrator.generate_tlm(
            topic=request.topic,
            content=request.content,
            language=request.language
        )
        
        if isinstance(tlm, dict) and "raw_response" in tlm:
             raise HTTPException(status_code=500, detail="Failed to generate structured TLM. Please try again.")
             
        if not tlm or not tlm.get("diy_workshop"):
             raise HTTPException(status_code=500, detail="No TLM content was generated. Please try again.")
             
        return tlm
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"TLM generation error: {str(e)}")


@router.post("/audit", response_model=AuditResponse)
async def generate_audit(
    request: AuditRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mode 6: Audit content for NCERT compliance.
    """
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    orchestrator = AIOrchestrator(system_settings=system_settings)

    try:
        audit = await orchestrator.audit_content(
            topic=request.topic,
            content=request.content,
            grade=request.grade,
            subject=request.subject
        )

        if isinstance(audit, dict) and "raw_response" in audit:
             raise HTTPException(status_code=500, detail="Failed to generate structured audit. Please try again.")

        if not audit or "is_compliant" not in audit:
             raise HTTPException(status_code=500, detail="No audit content was generated. Please try again.")

        return audit
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Audit generation error: {str(e)}")
