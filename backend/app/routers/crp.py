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
    """Submit CRP/ARP response to a teacher query."""
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
        tag=response_data.tag,
        overrides_ai=response_data.overrides_ai,
        override_reason=response_data.override_reason,
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
