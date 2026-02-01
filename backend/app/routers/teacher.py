"""
Teacher Router - For teacher-specific endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel, QueryMode
from app.models.reflection import Reflection
from app.schemas.query import QueryResponse, QueryListResponse
from app.schemas.reflection import ReflectionCreate, ReflectionResponse
from app.schemas.user import UserUpdate, UserResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/teacher", tags=["Teacher"])


@router.get("/queries", response_model=QueryListResponse)
async def get_my_queries(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    mode: Optional[QueryMode] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current teacher's query history."""
    query = select(QueryModel).where(QueryModel.user_id == current_user.id)
    
    if mode:
        query = query.where(QueryModel.mode == mode)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.order_by(QueryModel.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    queries = result.scalars().all()
    
    return QueryListResponse(
        items=[QueryResponse.model_validate(q) for q in queries],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/queries/{query_id}", response_model=QueryResponse)
async def get_query(
    query_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific query by ID."""
    result = await db.execute(
        select(QueryModel).where(
            QueryModel.id == query_id,
            QueryModel.user_id == current_user.id
        )
    )
    query = result.scalar_one_or_none()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    return QueryResponse.model_validate(query)


@router.post("/reflections", response_model=ReflectionResponse)
async def create_reflection(
    reflection_data: ReflectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit reflection/feedback on an AI suggestion."""
    # Verify query belongs to user
    result = await db.execute(
        select(QueryModel).where(
            QueryModel.id == reflection_data.query_id,
            QueryModel.user_id == current_user.id
        )
    )
    query = result.scalar_one_or_none()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Check if reflection already exists
    existing = await db.execute(
        select(Reflection).where(Reflection.query_id == reflection_data.query_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Reflection already exists for this query")
    
    reflection = Reflection(
        query_id=reflection_data.query_id,
        tried=reflection_data.tried,
        worked=reflection_data.worked,
        text_feedback=reflection_data.text_feedback,
        voice_note_url=reflection_data.voice_note_url,
        voice_note_transcript=reflection_data.voice_note_transcript,
    )
    
    # If transcript exists, analyze pedagogical sentiment
    if reflection.voice_note_transcript:
        from app.services.transcription import TranscriptionService
        import json
        
        t_service = TranscriptionService()
        analysis = await t_service.analyze_pedagogical_sentiment(reflection.voice_note_transcript)
        
        reflection.pedagogical_sentiment = analysis.get("sentiment")
        reflection.analysis_json = json.dumps(analysis)
        
        # If teacher is frustrated, we could flag this query?
        # For now just store it.
    
    db.add(reflection)
    
    # Mark query as resolved if feedback is positive
    if reflection_data.worked:
        query.is_resolved = True
    
    await db.commit()
    await db.refresh(reflection)
    
    return ReflectionResponse.model_validate(reflection)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update teacher profile."""
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.get("/stats")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get teacher's usage statistics."""
    # Total queries
    total_result = await db.execute(
        select(func.count()).where(QueryModel.user_id == current_user.id)
    )
    total_queries = total_result.scalar()
    
    # Queries by mode
    mode_counts = {}
    for mode in QueryMode:
        result = await db.execute(
            select(func.count()).where(
                QueryModel.user_id == current_user.id,
                QueryModel.mode == mode
            )
        )
        mode_counts[mode.value] = result.scalar()
    
    # Reflection stats
    reflection_result = await db.execute(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.user_id == current_user.id,
            Reflection.worked == True
        )
    )
    successful_suggestions = reflection_result.scalar()
    
    return {
        "total_queries": total_queries,
        "queries_by_mode": mode_counts,
        "successful_suggestions": successful_suggestions,
        "success_rate": (successful_suggestions / total_queries * 100) if total_queries > 0 else 0,
    }


# ==================== PHASE 2: CLASSROOM IMPLEMENTATION SUPPORT ====================

from pydantic import BaseModel
from typing import Optional
from app.ai.llm_client import LLMClient
from app.ai.prompts.classroom_help import get_classroom_help_prompt, get_micro_learning_prompt
import json


class ClassroomHelpRequest(BaseModel):
    """Request for immediate classroom help."""
    challenge: str
    grade: Optional[int] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    students_level: Optional[str] = None  # e.g., "below grade level", "mixed abilities"
    is_multigrade: bool = False
    class_size: Optional[int] = None
    instructional_time_minutes: Optional[int] = None


class MicroLearningRequest(BaseModel):
    """Request for micro-learning content."""
    topic: str
    grade: int
    subject: str
    duration_minutes: int = 5


@router.post("/classroom-help")
async def get_classroom_help(
    request: ClassroomHelpRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get immediate help for classroom implementation challenges.
    
    Use when teacher is IN the classroom and stuck.
    Returns actionable guidance that can be used RIGHT NOW.
    """
    # Generate prompt
    prompt = get_classroom_help_prompt(
        challenge=request.challenge,
        grade=request.grade,
        subject=request.subject,
        topic=request.topic,
        students_level=request.students_level,
        is_multigrade=request.is_multigrade,
        class_size=request.class_size,
        instructional_time_minutes=request.instructional_time_minutes,
    )
    
    # Get AI response
    llm_client = LLMClient()
    response_text = await llm_client.generate(prompt)
    
    # Parse JSON response
    try:
        # Clean up response if needed
        if response_text.startswith("```"):
            response_text = response_text.strip("```json\n").strip("```")
        guidance = json.loads(response_text)
    except json.JSONDecodeError:
        guidance = {
            "understanding": "I understand you're facing a challenge.",
            "immediate_action": response_text[:500],
            "quick_activity": "Try asking students what they already know about this topic.",
            "bridge_the_gap": "Start from what students know and build up.",
            "check_progress": "Ask a simple question to check understanding.",
            "for_later": "Plan prerequisite review for future lessons."
        }
    
    # Store query for history
    new_query = QueryModel(
        user_id=current_user.id,
        mode=QueryMode.ASSIST,  # Using ASSIST mode for classroom help
        question=request.challenge,
        response=response_text,
        grade=request.grade,
        subject=request.subject,
        topic=request.topic,
        is_multigrade=request.is_multigrade,
        class_size=request.class_size,
        instructional_time_minutes=request.instructional_time_minutes,
    )
    db.add(new_query)
    await db.commit()
    
    return {
        "status": "success",
        "guidance": guidance,
        "query_id": new_query.id
    }


@router.post("/micro-learning")
async def get_micro_learning(
    request: MicroLearningRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get micro-learning content to quickly learn/review a topic.
    
    Use before teaching a topic to refresh knowledge.
    """
    # Generate prompt
    prompt = get_micro_learning_prompt(
        topic=request.topic,
        grade=request.grade,
        subject=request.subject,
        duration_minutes=request.duration_minutes,
    )
    
    # Get AI response
    llm_client = LLMClient()
    response_text = await llm_client.generate(prompt)
    
    # Parse JSON response
    try:
        if response_text.startswith("```"):
            response_text = response_text.strip("```json\n").strip("```")
        content = json.loads(response_text)
    except json.JSONDecodeError:
        content = {
            "topic_summary": f"Overview of {request.topic}",
            "key_concepts": ["Concept 1", "Concept 2"],
            "common_misconceptions": ["Common mistake 1"],
            "teaching_sequence": [{"step": 1, "what": "Introduction", "how": "Explain basics", "time": "2 min"}],
            "error": "Could not parse structured response"
        }
    
    return {
        "status": "success",
        "content": content,
        "topic": request.topic,
        "grade": request.grade,
        "subject": request.subject
    }


# Quick prompts for common scenarios (can be used by frontend)
QUICK_PROMPTS = [
    {
        "id": "classroom_management",
        "title": "Classroom Management",
        "icon": "users",
        "prompts": [
            "Students are distracted and not paying attention",
            "Some students are disrupting the class",
            "How to manage a multi-grade classroom",
            "Students complete work at different speeds"
        ]
    },
    {
        "id": "explaining_concepts", 
        "title": "Explaining Concepts",
        "icon": "lightbulb",
        "prompts": [
            "Students don't understand the prerequisite concepts",
            "How to explain this topic using everyday examples",
            "Students are memorizing but not understanding",
            "How to check if students truly understand"
        ]
    },
    {
        "id": "activities",
        "title": "Quick Activities",
        "icon": "activity",
        "prompts": [
            "Need a 5-minute activity for this topic",
            "Group activity for mixed ability class",
            "Activity with minimal resources",
            "How to make this lesson interactive"
        ]
    },
    {
        "id": "time_filler",
        "title": "Time Management",
        "icon": "clock",
        "prompts": [
            "Lesson finished early, need 10-minute filler",
            "Running out of time, how to wrap up quickly",
            "Students finished early, what to do next",
            "How to pace the lesson better"
        ]
    }
]


@router.get("/quick-prompts")
async def get_quick_prompts():
    """Get quick prompt suggestions for common classroom scenarios."""
    return {"prompts": QUICK_PROMPTS}


# ==================== MY VISITS (Interventions scheduled by CRP) ====================

from app.models.visit import Visit, VisitStatus, TeacherVisitResponse
from sqlalchemy import or_
from datetime import date as date_type

@router.get("/my-visits")
async def get_my_visits(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get visits/interventions scheduled for this teacher by CRPs.
    
    Teachers can see upcoming and past visits to track CRP support.
    """
    # Query visits for this teacher
    query = select(Visit).where(Visit.teacher_id == current_user.id)
    
    # Also match by name for backwards compatibility
    teacher_name = current_user.name.lower().strip() if current_user.name else ""
    if teacher_name:
        query = select(Visit).where(
            or_(
                Visit.teacher_id == current_user.id,
                func.lower(Visit.teacher_name) == teacher_name
            )
        )
    
    # Apply status filter if provided
    if status:
        try:
            status_enum = VisitStatus(status)
            query = query.where(Visit.status == status_enum)
        except ValueError:
            pass
    
    query = query.order_by(Visit.visit_date.desc())
    
    result = await db.execute(query)
    visits = result.scalars().all()
    
    # Convert to dicts
    all_visits = [v.to_dict() for v in visits]
    
    # Separate into upcoming and past
    today = date_type.today().isoformat()
    upcoming = [v for v in all_visits if v.get("date", "") >= today and v.get("status") == "scheduled"]
    past = [v for v in all_visits if v.get("date", "") < today or v.get("status") != "scheduled"]
    
    return {
        "visits": all_visits,
        "upcoming": upcoming,
        "past": past,
        "total": len(all_visits),
        "stats": {
            "upcoming_count": len(upcoming),
            "completed": len([v for v in all_visits if v.get("status") == "completed"]),
            "cancelled": len([v for v in all_visits if v.get("status") == "cancelled"]),
            "pending_response": len([v for v in all_visits if v.get("teacher_response") == "pending"]),
        }
    }


class VisitAcknowledgeRequest(BaseModel):
    """Request body for visit acknowledgment."""
    response: str  # "accepted" or "reschedule_requested"
    notes: Optional[str] = None
    proposed_date: Optional[str] = None  # YYYY-MM-DD (for reschedule)
    proposed_time: Optional[str] = None  # HH:MM (for reschedule)


@router.post("/visits/{visit_id}/acknowledge")
async def acknowledge_visit(
    visit_id: int,
    ack: VisitAcknowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Teacher acknowledges a scheduled visit.
    
    Use to accept the visit or request rescheduling.
    """
    visit = await db.get(Visit, visit_id)
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Check if this is the teacher's visit
    is_teacher_visit = (
        visit.teacher_id == current_user.id or 
        (current_user.name and visit.teacher_name and 
         current_user.name.lower().strip() == visit.teacher_name.lower().strip())
    )
    
    if not is_teacher_visit:
        raise HTTPException(status_code=403, detail="Not authorized for this visit")
    
    # Mark as acknowledged
    from datetime import datetime
    visit.teacher_acknowledged = True
    visit.teacher_acknowledged_at = datetime.now()
    
    # Set response
    try:
        visit.teacher_response = TeacherVisitResponse(ack.response)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid response: {ack.response}")
    
    visit.teacher_response_notes = ack.notes
    
    # Handle reschedule request
    if ack.response == "reschedule_requested":
        if ack.proposed_date:
            try:
                visit.proposed_reschedule_date = date_type.fromisoformat(ack.proposed_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid proposed date format")
        visit.proposed_reschedule_time = ack.proposed_time
    
    # If accepted, update status to confirmed
    if ack.response == "accepted":
        visit.status = VisitStatus.CONFIRMED
    
    await db.commit()
    await db.refresh(visit)
    
    return visit.to_dict()


