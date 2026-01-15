"""
CRP/ARP Router - For Cluster/Academic Resource Persons
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel, QueryMode
from app.models.reflection import Reflection, CRPResponse, ResponseTag
from app.schemas.query import QueryResponse, QueryListResponse
from app.schemas.reflection import CRPResponseCreate, CRPResponseResponse
from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/crp", tags=["CRP/ARP"])


@router.get("/queries", response_model=QueryListResponse)
async def get_teacher_queries(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    mode: Optional[QueryMode] = None,
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    requires_review: Optional[bool] = None,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get teacher queries for review (CRP/ARP only)."""
    query = select(QueryModel)
    
    if mode:
        query = query.where(QueryModel.mode == mode)
    if grade:
        query = query.where(QueryModel.grade == grade)
    if subject:
        query = query.where(QueryModel.subject == subject)
    if requires_review is not None:
        query = query.where(QueryModel.requires_crp_review == requires_review)
    
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


@router.get("/queries/{query_id}")
async def get_query_detail(
    query_id: int,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed query information including teacher and reflection."""
    result = await db.execute(
        select(QueryModel).where(QueryModel.id == query_id)
    )
    query = result.scalar_one_or_none()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Get teacher info
    teacher_result = await db.execute(
        select(User).where(User.id == query.user_id)
    )
    teacher = teacher_result.scalar_one_or_none()
    
    # Get reflection if exists
    reflection_result = await db.execute(
        select(Reflection).where(Reflection.query_id == query_id)
    )
    reflection = reflection_result.scalar_one_or_none()
    
    # Get CRP responses
    crp_responses_result = await db.execute(
        select(CRPResponse).where(CRPResponse.query_id == query_id)
    )
    crp_responses = crp_responses_result.scalars().all()
    
    return {
        "query": QueryResponse.model_validate(query),
        "teacher": {
            "id": teacher.id,
            "name": teacher.name,
            "school_name": teacher.school_name,
            "school_district": teacher.school_district,
        } if teacher else None,
        "reflection": {
            "tried": reflection.tried,
            "worked": reflection.worked,
            "text_feedback": reflection.text_feedback,
        } if reflection else None,
        "crp_responses": [
            CRPResponseResponse.model_validate(r) for r in crp_responses
        ],
    }


@router.post("/respond", response_model=CRPResponseResponse)
async def respond_to_query(
    response_data: CRPResponseCreate,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP)),
    db: AsyncSession = Depends(get_db)
):
    """Submit CRP/ARP response to a teacher query. Supports text and/or voice responses."""
    # Verify query exists
    result = await db.execute(
        select(QueryModel).where(QueryModel.id == response_data.query_id)
    )
    query = result.scalar_one_or_none()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    crp_response = CRPResponse(
        query_id=response_data.query_id,
        crp_id=current_user.id,
        response_text=response_data.response_text,
        voice_note_url=response_data.voice_note_url,
        voice_note_duration_sec=response_data.voice_note_duration_sec,
        tag=response_data.tag,
        overrides_ai=response_data.overrides_ai,
        override_reason=response_data.override_reason,
        observation_notes=response_data.observation_notes,
        voice_note_transcript=response_data.voice_note_transcript,
    )
    
    db.add(crp_response)
    
    # Update query status
    query.requires_crp_review = False
    
    await db.commit()
    await db.refresh(crp_response)
    
    return CRPResponseResponse.model_validate(crp_response)



@router.get("/stats")
async def get_crp_stats(
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get CRP dashboard statistics."""
    # Pending reviews
    pending_result = await db.execute(
        select(func.count()).where(QueryModel.requires_crp_review == True)
    )
    pending_reviews = pending_result.scalar()
    
    # Total queries today
    from datetime import date
    today_result = await db.execute(
        select(func.count()).where(
            func.date(QueryModel.created_at) == date.today()
        )
    )
    queries_today = today_result.scalar()
    
    # Responses by tag
    tag_counts = {}
    for tag in ResponseTag:
        result = await db.execute(
            select(func.count()).where(CRPResponse.tag == tag)
        )
        tag_counts[tag.value] = result.scalar()
    
    return {
        "pending_reviews": pending_reviews,
        "queries_today": queries_today,
        "responses_by_tag": tag_counts,
    }


# ==================== PHASE 3: CRP FEEDBACK ASSISTANT ====================

from pydantic import BaseModel
from typing import Optional, List
from app.ai.llm_client import LLMClient
from app.ai.prompts.crp_feedback import get_crp_feedback_prompt, get_improvement_plan_prompt
import json


class FeedbackGenerateRequest(BaseModel):
    """Request to generate specific feedback for a teacher."""
    teacher_name: str
    class_observed: str
    subject: str
    topic_taught: str
    observation_notes: str
    strengths_observed: Optional[str] = None
    areas_of_concern: Optional[str] = None


class ImprovementPlanRequest(BaseModel):
    """Request to generate improvement plan."""
    teacher_name: str
    key_areas: List[str]
    current_strengths: List[str]
    visit_frequency: str = "monthly"


@router.post("/generate-feedback")
async def generate_teacher_feedback(
    request: FeedbackGenerateRequest,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP)),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate specific, actionable feedback for a teacher based on observation.
    
    This helps CRPs convert their raw notes into constructive, detailed feedback.
    """
    # Generate prompt
    prompt = get_crp_feedback_prompt(
        teacher_name=request.teacher_name,
        class_observed=request.class_observed,
        subject=request.subject,
        topic_taught=request.topic_taught,
        observation_notes=request.observation_notes,
        strengths_observed=request.strengths_observed,
        areas_of_concern=request.areas_of_concern,
    )
    
    # Get AI response
    llm_client = LLMClient()
    response_text = await llm_client.generate(prompt)
    
    # Parse JSON response with extreme robust extraction
    feedback = None
    try:
        import re
        patterns = [
            r'```json\s*(.*?)\s*(?:```|$)',
            r"'''json\s*(.*?)\s*(?:'''|$)",
            r'```\s*(.*?)\s*(?:```|$)',
            r'(\{.*\})'
        ]
        text_to_parse = response_text.strip()
        for pattern in patterns:
            match = re.search(pattern, text_to_parse, re.DOTALL)
            if match:
                try:
                    feedback = json.loads(match.group(1).strip())
                    if isinstance(feedback, dict): break
                except: pass
        
        if not feedback:
            start, end = text_to_parse.find('{'), text_to_parse.rfind('}')
            if start != -1 and end != -1:
                try: feedback = json.loads(text_to_parse[start:end+1])
                except: pass
    except Exception:
        pass

    if not feedback:
        feedback = {
            "strengths": ["Teacher showed good rapport with students", "Clear explanation of concepts"],
            "actionable_suggestions": [
                {
                    "category": "Pedagogy",
                    "suggestion": "Try incorporating more interactive elements",
                    "how_to_implement": "Ask students to explain concepts to each other in pairs"
                }
            ],
            "recommended_micro_learning": [
                {
                    "resource_title": "Active Learning Techniques",
                    "type": "Video",
                    "focus_area": "Student Engagement"
                }
            ],
            "suggested_feedback_script": "You showed excellent connection with students today. I noticed some opportunities to increase engagement - let's discuss a simple technique you can try next class."
        }
    
    return {
        "status": "success",
        "feedback": feedback,
        "teacher_name": request.teacher_name,
        "generated_by": current_user.name or current_user.phone
    }


@router.post("/generate-improvement-plan")
async def generate_improvement_plan(
    request: ImprovementPlanRequest,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP)),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a structured improvement plan for a teacher.
    
    Use after multiple observations to create a development roadmap.
    """
    # Generate prompt
    prompt = get_improvement_plan_prompt(
        teacher_name=request.teacher_name,
        key_areas=request.key_areas,
        current_strengths=request.current_strengths,
        visit_frequency=request.visit_frequency,
    )
    
    # Get AI response
    llm_client = LLMClient()
    response_text = await llm_client.generate(prompt)
    
    # Parse JSON response with extreme robust extraction
    plan = None
    try:
        import re
        patterns = [
            r'```json\s*(.*?)\s*(?:```|$)',
            r"'''json\s*(.*?)\s*(?:'''|$)",
            r'```\s*(.*?)\s*(?:```|$)',
            r'(\{.*\})'
        ]
        text_to_parse = response_text.strip()
        for pattern in patterns:
            match = re.search(pattern, text_to_parse, re.DOTALL)
            if match:
                try:
                    plan = json.loads(match.group(1).strip())
                    if isinstance(plan, dict): break
                except: pass
        
        if not plan:
            start, end = text_to_parse.find('{'), text_to_parse.rfind('}')
            if start != -1 and end != -1:
                try: plan = json.loads(text_to_parse[start:end+1])
                except: pass
    except Exception:
        pass

    if not plan:
        plan = {
            "goal": f"Support {request.teacher_name}'s professional development",
            "timeline": "3 months",
            "monthly_focus": [{"month": 1, "focus_area": "Primary improvement area", "activities": ["Practice regularly"], "support_needed": "CRP guidance", "milestone": "Initial progress"}],
            "quick_wins": ["Start with small changes"],
            "peer_learning": "Collaborate with other teachers",
            "self_assessment": ["Reflect on progress regularly"],
            "recognition": "Celebrate improvements"
        }
    
    return {
        "status": "success",
        "plan": plan,
        "teacher_name": request.teacher_name,
        "generated_by": current_user.name or current_user.phone
    }


# Observation template for CRPs
OBSERVATION_TEMPLATE = {
    "instruction": "Use this template when observing a classroom",
    "sections": [
        {
            "title": "Basic Information",
            "fields": ["teacher_name", "class_observed", "subject", "topic_taught", "date", "time"]
        },
        {
            "title": "Classroom Environment",
            "prompts": [
                "How is the seating arrangement?",
                "Are learning materials visible?",
                "Is the board being used effectively?"
            ]
        },
        {
            "title": "Teaching Process",
            "prompts": [
                "How did the teacher begin the lesson?",
                "What methods were used to explain concepts?",
                "Were students asked questions?",
                "How were activities organized?"
            ]
        },
        {
            "title": "Student Engagement",
            "prompts": [
                "Were all students participating?",
                "How were struggling students supported?",
                "Were advanced students challenged?"
            ]
        },
        {
            "title": "Key Observations",
            "prompts": [
                "What worked well? (strengths)",
                "What could be improved? (areas of concern)",
                "Any specific incidents to note?"
            ]
        }
    ]
}


@router.get("/observation-template")
async def get_observation_template():
    """Get observation template for CRPs to use during classroom visits."""
    return OBSERVATION_TEMPLATE


# ==================== BEST PRACTICE LIBRARY ====================

@router.post("/responses/{response_id}/mark-best-practice")
async def mark_as_best_practice(
    response_id: int,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Mark a CRP response as a best practice for the shared strategy pool."""
    result = await db.execute(
        select(CRPResponse).where(CRPResponse.id == response_id)
    )
    response = result.scalar_one_or_none()
    
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    response.is_best_practice = True
    await db.commit()
    
    return {"message": "Marked as best practice", "response_id": response_id}


@router.delete("/responses/{response_id}/mark-best-practice")
async def unmark_best_practice(
    response_id: int,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Remove best practice status from a CRP response."""
    result = await db.execute(
        select(CRPResponse).where(CRPResponse.id == response_id)
    )
    response = result.scalar_one_or_none()
    
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    response.is_best_practice = False
    await db.commit()
    
    return {"message": "Removed best practice status", "response_id": response_id}


@router.get("/best-practices")
async def get_best_practices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    subject: Optional[str] = None,
    grade: Optional[int] = None,
    mode: Optional[QueryMode] = None,
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.TEACHER, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get shared strategy pool - all responses marked as best practices.
    Teachers can also access this to learn from effective strategies.
    """
    query = select(CRPResponse).join(QueryModel).where(CRPResponse.is_best_practice == True)
    
    if subject:
        query = query.where(QueryModel.subject == subject)
    if grade:
        query = query.where(QueryModel.grade == grade)
    if mode:
        query = query.where(QueryModel.mode == mode)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.order_by(CRPResponse.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    responses = result.scalars().all()
    
    # Enrich with query context
    items = []
    for resp in responses:
        query_result = await db.execute(
            select(QueryModel).where(QueryModel.id == resp.query_id)
        )
        q = query_result.scalar_one_or_none()
        
        items.append({
            "id": resp.id,
            "response_text": resp.response_text,
            "tag": resp.tag.value if resp.tag else None,
            "created_at": resp.created_at.isoformat(),
            "query_context": {
                "input_text": q.input_text[:200] if q and q.input_text else None,
                "mode": q.mode.value if q else None,
                "grade": q.grade if q else None,
                "subject": q.subject if q else None,
                "topic": q.topic if q else None,
            } if q else None
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
