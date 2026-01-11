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
    )
    
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
