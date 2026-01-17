"""
Feedback API Router
Handles feedback requests and responses between roles
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, UserRole
from app.models.feedback import FeedbackRequest, FeedbackResponse, FeedbackStatus, QueryShare
from app.routers.auth import get_current_user

router = APIRouter(prefix="/feedback", tags=["feedback"])


# ============== Schemas ==============

class QuestionSchema(BaseModel):
    text: str
    type: str = "text"  # text, rating, choice
    options: Optional[List[str]] = None
    required: bool = True


class FeedbackRequestCreate(BaseModel):
    target_user_id: int
    title: str
    description: Optional[str] = None
    questions: List[QuestionSchema]
    due_date: Optional[datetime] = None


class FeedbackResponseCreate(BaseModel):
    request_id: int
    answers: List[dict]  # [{question_index, answer}]
    additional_notes: Optional[str] = None


class FeedbackRequestOut(BaseModel):
    id: int
    requester_id: int
    requester_name: Optional[str] = None
    target_user_id: int
    title: str
    description: Optional[str]
    questions: List[dict]
    status: str
    due_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class FeedbackResponseOut(BaseModel):
    id: int
    request_id: int
    responder_id: int
    responder_name: Optional[str] = None
    answers: List[dict]
    additional_notes: Optional[str]
    submitted_at: datetime
    
    class Config:
        from_attributes = True


# ============== API Endpoints ==============

@router.post("/request", response_model=FeedbackRequestOut)
async def create_feedback_request(
    data: FeedbackRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a feedback request (CRP/ARP only)"""
    if current_user.role not in [UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only mentors can request feedback")
    
    # Verify target user exists
    target = await db.get(User, data.target_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    feedback_req = FeedbackRequest(
        requester_id=current_user.id,
        target_user_id=data.target_user_id,
        title=data.title,
        description=data.description,
        questions=[q.dict() for q in data.questions],
        due_date=data.due_date,
        status=FeedbackStatus.PENDING
    )
    
    db.add(feedback_req)
    await db.commit()
    await db.refresh(feedback_req)
    
    return FeedbackRequestOut(
        id=feedback_req.id,
        requester_id=feedback_req.requester_id,
        requester_name=current_user.name,
        target_user_id=feedback_req.target_user_id,
        title=feedback_req.title,
        description=feedback_req.description,
        questions=feedback_req.questions,
        status=feedback_req.status.value,
        due_date=feedback_req.due_date,
        created_at=feedback_req.created_at
    )


@router.post("/respond", response_model=FeedbackResponseOut)
async def submit_feedback_response(
    data: FeedbackResponseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit response to a feedback request"""
    # Get the request
    request = await db.get(FeedbackRequest, data.request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Feedback request not found")
    
    # Verify current user is the target
    if request.target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request")
    
    if request.status == FeedbackStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Feedback already submitted")
    
    response = FeedbackResponse(
        request_id=data.request_id,
        responder_id=current_user.id,
        answers=data.answers,
        additional_notes=data.additional_notes
    )
    
    # Update request status
    request.status = FeedbackStatus.COMPLETED
    
    db.add(response)
    await db.commit()
    await db.refresh(response)
    
    return FeedbackResponseOut(
        id=response.id,
        request_id=response.request_id,
        responder_id=response.responder_id,
        responder_name=current_user.name,
        answers=response.answers,
        additional_notes=response.additional_notes,
        submitted_at=response.submitted_at
    )


@router.get("/inbox", response_model=List[FeedbackRequestOut])
async def get_feedback_inbox(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending feedback requests for current user"""
    result = await db.execute(
        select(FeedbackRequest)
        .where(
            FeedbackRequest.target_user_id == current_user.id,
            FeedbackRequest.status == FeedbackStatus.PENDING
        )
        .order_by(FeedbackRequest.created_at.desc())
    )
    requests = result.scalars().all()
    
    # Get requester names
    output = []
    for req in requests:
        requester = await db.get(User, req.requester_id)
        output.append(FeedbackRequestOut(
            id=req.id,
            requester_id=req.requester_id,
            requester_name=requester.name if requester else None,
            target_user_id=req.target_user_id,
            title=req.title,
            description=req.description,
            questions=req.questions,
            status=req.status.value,
            due_date=req.due_date,
            created_at=req.created_at
        ))
    
    return output


@router.get("/sent", response_model=List[FeedbackRequestOut])
async def get_sent_feedback_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get feedback requests sent by current user (mentors)"""
    result = await db.execute(
        select(FeedbackRequest)
        .where(FeedbackRequest.requester_id == current_user.id)
        .order_by(FeedbackRequest.created_at.desc())
    )
    requests = result.scalars().all()
    
    output = []
    for req in requests:
        target = await db.get(User, req.target_user_id)
        output.append(FeedbackRequestOut(
            id=req.id,
            requester_id=req.requester_id,
            requester_name=current_user.name,
            target_user_id=req.target_user_id,
            title=req.title,
            description=req.description,
            questions=req.questions,
            status=req.status.value,
            due_date=req.due_date,
            created_at=req.created_at
        ))
    
    return output


@router.get("/responses/{request_id}", response_model=List[FeedbackResponseOut])
async def get_feedback_responses(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get responses for a feedback request (requester only)"""
    request = await db.get(FeedbackRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(
        select(FeedbackResponse)
        .where(FeedbackResponse.request_id == request_id)
    )
    responses = result.scalars().all()
    
    output = []
    for resp in responses:
        responder = await db.get(User, resp.responder_id)
        output.append(FeedbackResponseOut(
            id=resp.id,
            request_id=resp.request_id,
            responder_id=resp.responder_id,
            responder_name=responder.name if responder else None,
            answers=resp.answers,
            additional_notes=resp.additional_notes,
            submitted_at=resp.submitted_at
        ))
    
    return output
