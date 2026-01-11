"""
AI Interaction Router
"""
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.query import Query, QueryMode
from app.schemas.ai import AIRequest, AIResponse
from app.routers.auth import get_current_user
from app.services.ai_orchestrator import AIOrchestrator

router = APIRouter(prefix="/ai", tags=["AI"])


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
    
    # Create orchestrator and get response
    orchestrator = AIOrchestrator()
    
    try:
        response = await orchestrator.process_request(
            mode=request.mode,
            input_text=request.input_text,
            language=request.language,
            grade=request.grade,
            subject=request.subject,
            topic=request.topic,
            context=request.context,
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
        ai_response=response.get("content"),
        response_language=request.language,
        processing_time_ms=processing_time,
    )
    
    db.add(query)
    await db.commit()
    await db.refresh(query)
    
    return {
        "query_id": query.id,
        "mode": request.mode.value,
        "language": request.language,
        "content": response.get("content"),
        "structured": response.get("structured"),
        "processing_time_ms": processing_time,
        "suggestions": response.get("suggestions", []),
    }


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
