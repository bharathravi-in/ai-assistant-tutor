"""
Survey API Router
Handles survey creation, distribution, and response collection
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, UserRole
from app.models.survey import Survey, SurveyResponse, SurveyAssignment, SurveyStatus, SurveyTargetRole
from app.routers.auth import get_current_user

router = APIRouter(prefix="/surveys", tags=["surveys"])


# ============== Schemas ==============

class SurveyQuestionSchema(BaseModel):
    question: str
    type: str = "text"  # text, rating, single_choice, multi_choice
    options: Optional[List[str]] = None
    required: bool = True


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[SurveyQuestionSchema]
    target_role: Optional[str] = "teacher"
    target_user_ids: Optional[List[int]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SurveyGenerateRequest(BaseModel):
    context: str  # What the survey should be about
    target_user_ids: Optional[List[int]] = None
    num_questions: int = 5


class SurveyOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    questions: List[dict]
    target_role: str
    status: str
    is_ai_generated: bool
    created_at: datetime
    response_count: int = 0
    
    class Config:
        from_attributes = True


class SurveyResponseCreate(BaseModel):
    survey_id: int
    answers: List[dict]  # [{question_index, answer}]


class SurveyResponseOut(BaseModel):
    id: int
    survey_id: int
    user_id: int
    user_name: Optional[str] = None
    answers: List[dict]
    submitted_at: datetime
    
    class Config:
        from_attributes = True


# ============== API Endpoints ==============

@router.post("/", response_model=SurveyOut)
async def create_survey(
    data: SurveyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new survey (CRP/ARP only)"""
    if current_user.role not in [UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only mentors can create surveys")
    
    target_role = SurveyTargetRole.TEACHER
    if data.target_role == "crp":
        target_role = SurveyTargetRole.CRP
    elif data.target_role == "all":
        target_role = SurveyTargetRole.ALL
    
    survey = Survey(
        created_by_id=current_user.id,
        title=data.title,
        description=data.description,
        questions=[q.dict() for q in data.questions],
        target_role=target_role,
        target_user_ids=data.target_user_ids,
        start_date=data.start_date,
        end_date=data.end_date,
        status=SurveyStatus.DRAFT,
        is_ai_generated=False
    )
    
    db.add(survey)
    await db.commit()
    await db.refresh(survey)
    
    return SurveyOut(
        id=survey.id,
        title=survey.title,
        description=survey.description,
        questions=survey.questions,
        target_role=survey.target_role.value,
        status=survey.status.value,
        is_ai_generated=survey.is_ai_generated,
        created_at=survey.created_at,
        response_count=0
    )


@router.post("/generate", response_model=SurveyOut)
async def generate_survey_with_ai(
    data: SurveyGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a survey using AI based on teacher history"""
    if current_user.role not in [UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only mentors can generate surveys")
    
    # Import survey agent
    from app.services.survey_agent import SurveyAgent
    
    agent = SurveyAgent()
    generated = await agent.generate_survey(
        db=db,
        context=data.context,
        target_user_ids=data.target_user_ids,
        num_questions=data.num_questions
    )
    
    survey = Survey(
        created_by_id=current_user.id,
        title=generated["title"],
        description=generated["description"],
        questions=generated["questions"],
        target_role=SurveyTargetRole.TEACHER,
        target_user_ids=data.target_user_ids,
        status=SurveyStatus.DRAFT,
        is_ai_generated=True,
        generation_context=data.context
    )
    
    db.add(survey)
    await db.commit()
    await db.refresh(survey)
    
    return SurveyOut(
        id=survey.id,
        title=survey.title,
        description=survey.description,
        questions=survey.questions,
        target_role=survey.target_role.value,
        status=survey.status.value,
        is_ai_generated=survey.is_ai_generated,
        created_at=survey.created_at,
        response_count=0
    )


@router.post("/{survey_id}/publish")
async def publish_survey(
    survey_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publish a survey and send to target users"""
    survey = await db.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if survey.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    survey.status = SurveyStatus.ACTIVE
    survey.start_date = datetime.utcnow()
    
    # Create assignments for target users
    if survey.target_user_ids:
        for user_id in survey.target_user_ids:
            assignment = SurveyAssignment(
                survey_id=survey_id,
                user_id=user_id
            )
            db.add(assignment)
    
    await db.commit()
    
    return {"message": "Survey published successfully", "status": "active"}


@router.post("/respond", response_model=SurveyResponseOut)
async def submit_survey_response(
    data: SurveyResponseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit response to a survey"""
    survey = await db.get(Survey, data.survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if survey.status != SurveyStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Survey is not active")
    
    # Check if already responded
    existing = await db.execute(
        select(SurveyResponse).where(
            SurveyResponse.survey_id == data.survey_id,
            SurveyResponse.user_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already submitted response")
    
    response = SurveyResponse(
        survey_id=data.survey_id,
        user_id=current_user.id,
        answers=data.answers
    )
    
    db.add(response)
    
    # Update assignment if exists
    assignment_result = await db.execute(
        select(SurveyAssignment).where(
            SurveyAssignment.survey_id == data.survey_id,
            SurveyAssignment.user_id == current_user.id
        )
    )
    assignment = assignment_result.scalar_one_or_none()
    if assignment:
        assignment.is_completed = True
        assignment.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(response)
    
    return SurveyResponseOut(
        id=response.id,
        survey_id=response.survey_id,
        user_id=response.user_id,
        user_name=current_user.name,
        answers=response.answers,
        submitted_at=response.submitted_at
    )


@router.get("/my-surveys", response_model=List[SurveyOut])
async def get_my_surveys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get surveys created by current user"""
    result = await db.execute(
        select(Survey)
        .where(Survey.created_by_id == current_user.id)
        .order_by(Survey.created_at.desc())
    )
    surveys = result.scalars().all()
    
    output = []
    for s in surveys:
        # Count responses
        resp_result = await db.execute(
            select(SurveyResponse).where(SurveyResponse.survey_id == s.id)
        )
        response_count = len(resp_result.scalars().all())
        
        output.append(SurveyOut(
            id=s.id,
            title=s.title,
            description=s.description,
            questions=s.questions,
            target_role=s.target_role.value,
            status=s.status.value,
            is_ai_generated=s.is_ai_generated,
            created_at=s.created_at,
            response_count=response_count
        ))
    
    return output


@router.get("/assigned", response_model=List[SurveyOut])
async def get_assigned_surveys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get surveys assigned to current user"""
    result = await db.execute(
        select(SurveyAssignment)
        .where(
            SurveyAssignment.user_id == current_user.id,
            SurveyAssignment.is_completed == False
        )
    )
    assignments = result.scalars().all()
    
    output = []
    for a in assignments:
        survey = await db.get(Survey, a.survey_id)
        if survey and survey.status == SurveyStatus.ACTIVE:
            output.append(SurveyOut(
                id=survey.id,
                title=survey.title,
                description=survey.description,
                questions=survey.questions,
                target_role=survey.target_role.value,
                status=survey.status.value,
                is_ai_generated=survey.is_ai_generated,
                created_at=survey.created_at,
                response_count=0
            ))
    
    return output


@router.get("/{survey_id}/responses", response_model=List[SurveyResponseOut])
async def get_survey_responses(
    survey_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all responses for a survey (creator only)"""
    survey = await db.get(Survey, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if survey.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(
        select(SurveyResponse).where(SurveyResponse.survey_id == survey_id)
    )
    responses = result.scalars().all()
    
    output = []
    for r in responses:
        user = await db.get(User, r.user_id)
        output.append(SurveyResponseOut(
            id=r.id,
            survey_id=r.survey_id,
            user_id=r.user_id,
            user_name=user.name if user else None,
            answers=r.answers,
            submitted_at=r.submitted_at
        ))
    
    return output
