"""
Admin Router - For system administrators
"""
from typing import Optional
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel, QueryMode
from app.models.reflection import Reflection
from app.routers.auth import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard overview."""
    # Total users by role
    users_by_role = {}
    for role in UserRole:
        result = await db.execute(
            select(func.count()).where(User.role == role)
        )
        users_by_role[role.value] = result.scalar()
    
    # Total queries
    total_queries_result = await db.execute(select(func.count()).select_from(QueryModel))
    total_queries = total_queries_result.scalar()
    
    # Queries this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_result = await db.execute(
        select(func.count()).where(QueryModel.created_at >= week_ago)
    )
    queries_this_week = weekly_result.scalar()
    
    # Success rate (worked reflections)
    total_reflections_result = await db.execute(select(func.count()).select_from(Reflection))
    total_reflections = total_reflections_result.scalar()
    
    worked_result = await db.execute(
        select(func.count()).where(Reflection.worked == True)
    )
    worked_reflections = worked_result.scalar()
    
    success_rate = (worked_reflections / total_reflections * 100) if total_reflections > 0 else 0
    
    # Average response time
    avg_time_result = await db.execute(
        select(func.avg(QueryModel.processing_time_ms)).where(QueryModel.processing_time_ms.isnot(None))
    )
    avg_response_time_ms = avg_time_result.scalar() or 0
    
    return {
        "users_by_role": users_by_role,
        "total_users": sum(users_by_role.values()),
        "total_queries": total_queries,
        "queries_this_week": queries_this_week,
        "success_rate": round(success_rate, 1),
        "avg_response_time_ms": round(avg_response_time_ms),
    }


@router.get("/analytics/queries")
async def get_query_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    group_by: str = Query("day", enum=["day", "week", "month"]),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get query analytics over time."""
    query = select(
        func.date(QueryModel.created_at).label("date"),
        QueryModel.mode,
        func.count().label("count")
    )
    
    if start_date:
        query = query.where(func.date(QueryModel.created_at) >= start_date)
    if end_date:
        query = query.where(func.date(QueryModel.created_at) <= end_date)
    
    query = query.group_by(func.date(QueryModel.created_at), QueryModel.mode)
    query = query.order_by(func.date(QueryModel.created_at))
    
    result = await db.execute(query)
    rows = result.all()
    
    # Format results
    data = {}
    for row in rows:
        date_str = row.date.isoformat() if row.date else "unknown"
        if date_str not in data:
            data[date_str] = {"date": date_str, "total": 0}
        data[date_str][row.mode.value] = row.count
        data[date_str]["total"] += row.count
    
    return list(data.values())


@router.get("/analytics/heatmap")
async def get_query_heatmap(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get query heatmap by grade × subject × mode."""
    result = await db.execute(
        select(
            QueryModel.grade,
            QueryModel.subject,
            QueryModel.mode,
            func.count().label("count")
        ).where(
            QueryModel.grade.isnot(None),
            QueryModel.subject.isnot(None)
        ).group_by(
            QueryModel.grade,
            QueryModel.subject,
            QueryModel.mode
        )
    )
    rows = result.all()
    
    heatmap = []
    for row in rows:
        heatmap.append({
            "grade": row.grade,
            "subject": row.subject,
            "mode": row.mode.value,
            "count": row.count,
        })
    
    return heatmap


@router.get("/analytics/effectiveness")
async def get_effectiveness_analytics(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get strategy effectiveness metrics."""
    # By mode
    mode_effectiveness = {}
    for mode in QueryMode:
        total_result = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                QueryModel.mode == mode
            )
        )
        total = total_result.scalar()
        
        worked_result = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                QueryModel.mode == mode,
                Reflection.worked == True
            )
        )
        worked = worked_result.scalar()
        
        mode_effectiveness[mode.value] = {
            "total_reflections": total,
            "worked": worked,
            "success_rate": round((worked / total * 100) if total > 0 else 0, 1)
        }
    
    # By subject
    subject_result = await db.execute(
        select(
            QueryModel.subject,
            func.count(Reflection.id).label("total"),
            func.sum(func.cast(Reflection.worked, type_=db.bind.dialect.type_descriptor(type(1)))).label("worked")
        ).join(Reflection).where(
            QueryModel.subject.isnot(None)
        ).group_by(QueryModel.subject)
    )
    
    return {
        "by_mode": mode_effectiveness,
    }


@router.get("/users")
async def list_users(
    role: Optional[UserRole] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List all users with optional role filter."""
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    from app.schemas.user import UserResponse
    
    return {
        "items": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
