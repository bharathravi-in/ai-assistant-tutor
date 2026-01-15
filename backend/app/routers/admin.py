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


# ============== DIET Analytics Endpoints ==============

@router.get("/analytics/classroom-context")
async def get_classroom_context_analytics(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get analytics by classroom context (multigrade, class size) for DIET training redesign."""
    # Multigrade vs single-grade distribution
    multigrade_result = await db.execute(
        select(func.count()).where(QueryModel.is_multigrade == True)
    )
    multigrade_count = multigrade_result.scalar() or 0
    
    single_grade_result = await db.execute(
        select(func.count()).where(QueryModel.is_multigrade == False)
    )
    single_grade_count = single_grade_result.scalar() or 0
    
    # Class size distribution
    size_ranges = [
        ("small", 1, 20),
        ("medium", 21, 40),
        ("large", 41, 60),
        ("very_large", 61, 1000),
    ]
    class_size_distribution = {}
    for name, min_size, max_size in size_ranges:
        result = await db.execute(
            select(func.count()).where(
                QueryModel.class_size >= min_size,
                QueryModel.class_size <= max_size
            )
        )
        class_size_distribution[name] = result.scalar() or 0
    
    # Success rate by multigrade
    multigrade_total = await db.execute(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.is_multigrade == True
        )
    )
    multigrade_worked = await db.execute(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.is_multigrade == True, Reflection.worked == True
        )
    )
    mt, mw = multigrade_total.scalar() or 0, multigrade_worked.scalar() or 0
    
    single_total = await db.execute(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.is_multigrade == False
        )
    )
    single_worked = await db.execute(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.is_multigrade == False, Reflection.worked == True
        )
    )
    st, sw = single_total.scalar() or 0, single_worked.scalar() or 0
    
    return {
        "context_distribution": {
            "multigrade": multigrade_count,
            "single_grade": single_grade_count,
        },
        "class_size_distribution": class_size_distribution,
        "success_by_context": {
            "multigrade": {"total": mt, "worked": mw, "rate": round((mw / mt * 100) if mt > 0 else 0, 1)},
            "single_grade": {"total": st, "worked": sw, "rate": round((sw / st * 100) if st > 0 else 0, 1)},
        }
    }


@router.get("/analytics/reflection-sentiment")
async def get_reflection_sentiment_analytics(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregate pedagogical sentiment from teacher voice reflections for DIET insights."""
    result = await db.execute(
        select(
            Reflection.pedagogical_sentiment,
            func.count().label("count")
        ).where(
            Reflection.pedagogical_sentiment.isnot(None)
        ).group_by(Reflection.pedagogical_sentiment)
    )
    rows = result.all()
    
    sentiment_distribution = {}
    total = 0
    for row in rows:
        sentiment_distribution[row.pedagogical_sentiment] = row.count
        total += row.count
    
    # Add percentages
    sentiment_with_pct = {}
    for sentiment, count in sentiment_distribution.items():
        sentiment_with_pct[sentiment] = {
            "count": count,
            "percentage": round((count / total * 100) if total > 0 else 0, 1)
        }
    
    return {
        "total_analyzed": total,
        "sentiments": sentiment_with_pct,
    }


@router.get("/analytics/training-gaps")
async def get_training_gaps_analytics(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Identify training gaps by subject+grade with lowest success rates."""
    # Get subjects/grades with low success rates
    result = await db.execute(
        select(
            QueryModel.subject,
            QueryModel.grade,
            func.count(Reflection.id).label("total_reflections"),
            func.sum(func.cast(Reflection.worked == True, Integer)).label("worked_count")
        ).join(Reflection).where(
            QueryModel.subject.isnot(None),
            QueryModel.grade.isnot(None)
        ).group_by(
            QueryModel.subject,
            QueryModel.grade
        ).having(
            func.count(Reflection.id) >= 3  # Minimum sample size
        )
    )
    rows = result.all()
    
    gaps = []
    for row in rows:
        total = row.total_reflections or 0
        worked = row.worked_count or 0
        success_rate = round((worked / total * 100) if total > 0 else 0, 1)
        gaps.append({
            "subject": row.subject,
            "grade": row.grade,
            "total_reflections": total,
            "worked": worked,
            "success_rate": success_rate,
            "needs_attention": success_rate < 50
        })
    
    # Sort by success rate (ascending) to show worst gaps first
    gaps.sort(key=lambda x: x["success_rate"])
    
    return {
        "training_gaps": gaps[:limit],
        "total_gaps_identified": len([g for g in gaps if g["needs_attention"]]),
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


# ============== User CRUD ==============

from pydantic import BaseModel, Field
from typing import List
from fastapi import HTTPException, status
from app.utils.security import get_password_hash
from app.models.subscription import AuditLog


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    phone: str = Field(..., min_length=10, max_length=15)
    name: Optional[str] = None
    email: Optional[str] = None
    role: UserRole = UserRole.TEACHER
    language: str = "en"
    password: Optional[str] = None
    school_name: Optional[str] = None
    school_district: Optional[str] = None
    school_block: Optional[str] = None
    school_state: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    school_name: Optional[str] = None
    school_district: Optional[str] = None
    school_block: Optional[str] = None
    school_state: Optional[str] = None


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user."""
    # Check if phone already exists
    existing = await db.execute(select(User).where(User.phone == user_data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    user = User(
        phone=user_data.phone,
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        language=user_data.language,
        organization_id=current_user.organization_id,
        school_name=user_data.school_name,
        school_district=user_data.school_district,
        school_block=user_data.school_block,
        school_state=user_data.school_state,
        hashed_password=get_password_hash(user_data.password) if user_data.password else None,
        is_active=True,
        is_verified=False,
    )
    
    db.add(user)
    await db.flush()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="user.create",
        resource_type="user",
        resource_id=user.id,
        new_values={"phone": user.phone, "name": user.name, "role": user.role.value}
    )
    db.add(audit)
    await db.commit()
    
    from app.schemas.user import UserResponse
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    update_data: UserUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Update a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_values = {}
    new_values = {}
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(user, key):
            old_val = getattr(user, key)
            if old_val != value:
                old_values[key] = str(old_val) if old_val else None
                new_values[key] = str(value) if value else None
                setattr(user, key, value)
    
    if new_values:
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            action="user.update",
            resource_type="user",
            resource_id=user_id,
            old_values=old_values,
            new_values=new_values
        )
        db.add(audit)
    
    await db.commit()
    
    from app.schemas.user import UserResponse
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate a user (soft delete)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    user.is_active = False
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="user.deactivate",
        resource_type="user",
        resource_id=user_id,
        old_values={"is_active": True},
        new_values={"is_active": False}
    )
    db.add(audit)
    await db.commit()
    
    return {"message": "User deactivated", "user_id": user_id}


# ============== Audit Logs ==============

@router.get("/audit-logs")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List audit logs with optional filters."""
    query = select(AuditLog)
    
    # Filter by organization if not superadmin
    if current_user.organization_id:
        query = query.where(AuditLog.organization_id == current_user.organization_id)
    
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.order_by(AuditLog.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "user_id": log.user_id,
            "organization_id": log.organization_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "created_at": log.created_at.isoformat()
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

