"""
Admin Router - For system administrators
"""
from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, Integer, case

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel, QueryMode
from app.models.reflection import Reflection
from app.models.config import State, District, Block, Cluster, School
from app.routers.auth import require_role, get_password_hash
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.models.subscription import AuditLog

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard overview - filtered by organization."""
    org_id = current_user.organization_id
    
    # Total users by role - ONLY users in this organization
    users_by_role = {}
    for role in UserRole:
        # Skip superadmin in counts - they don't belong to organizations
        if role == UserRole.SUPERADMIN:
            continue
        result = await db.execute(
            select(func.count()).where(
                User.role == role,
                User.organization_id == org_id
            )
        )
        users_by_role[role.value] = result.scalar()
    
    # Total queries - only from users in this organization
    total_queries_result = await db.execute(
        select(func.count()).select_from(QueryModel).join(
            User, QueryModel.user_id == User.id
        ).where(
            User.organization_id == org_id
        )
    )
    total_queries = total_queries_result.scalar()
    
    # Queries this week - only from users in this organization
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_result = await db.execute(
        select(func.count()).select_from(QueryModel).join(
            User, QueryModel.user_id == User.id
        ).where(
            QueryModel.created_at >= week_ago,
            User.organization_id == org_id
        )
    )
    queries_this_week = weekly_result.scalar()
    
    # Success rate - reflections are linked via Query -> User
    # Reflection -> Query -> User
    total_reflections_result = await db.execute(
        select(func.count()).select_from(Reflection).join(
            QueryModel, Reflection.query_id == QueryModel.id
        ).join(
            User, QueryModel.user_id == User.id
        ).where(
            User.organization_id == org_id
        )
    )
    total_reflections = total_reflections_result.scalar()
    
    worked_result = await db.execute(
        select(func.count()).select_from(Reflection).join(
            QueryModel, Reflection.query_id == QueryModel.id
        ).join(
            User, QueryModel.user_id == User.id
        ).where(
            Reflection.worked == True,
            User.organization_id == org_id
        )
    )
    worked_reflections = worked_result.scalar()
    
    success_rate = (worked_reflections / total_reflections * 100) if total_reflections > 0 else 0
    
    # Average response time - only queries from users in this organization
    avg_time_result = await db.execute(
        select(func.avg(QueryModel.processing_time_ms)).select_from(QueryModel).join(
            User, QueryModel.user_id == User.id
        ).where(
            QueryModel.processing_time_ms.isnot(None),
            User.organization_id == org_id
        )
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
    """Get query analytics over time - filtered by organization."""
    org_id = current_user.organization_id
    
    query = select(
        func.date(QueryModel.created_at).label("date"),
        QueryModel.mode,
        func.count().label("count")
    ).join(User, QueryModel.user_id == User.id).where(
        User.organization_id == org_id
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
    """Get query heatmap by grade × subject × mode - filtered by organization."""
    org_id = current_user.organization_id
    
    result = await db.execute(
        select(
            QueryModel.grade,
            QueryModel.subject,
            QueryModel.mode,
            func.count().label("count")
        ).join(User, QueryModel.user_id == User.id).where(
            User.organization_id == org_id,
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
    """Get strategy effectiveness metrics - filtered by organization."""
    org_id = current_user.organization_id
    try:
        # By mode
        mode_effectiveness = {}
        for mode in QueryMode:
            # Reflection -> Query -> User
            total_result = await db.execute(
                select(func.count()).select_from(Reflection).join(
                    QueryModel, Reflection.query_id == QueryModel.id
                ).join(
                    User, QueryModel.user_id == User.id
                ).where(
                    QueryModel.mode == mode,
                    User.organization_id == org_id
                )
            )
            total = total_result.scalar() or 0
            
            worked_result = await db.execute(
                select(func.count()).select_from(Reflection).join(
                    QueryModel, Reflection.query_id == QueryModel.id
                ).join(
                    User, QueryModel.user_id == User.id
                ).where(
                    QueryModel.mode == mode,
                    Reflection.worked == True,
                    User.organization_id == org_id
                )
            )
            worked = worked_result.scalar() or 0
            
            mode_effectiveness[mode.value] = {
                "total_reflections": total,
                "worked": worked,
                "success_rate": round((worked / total * 100) if total > 0 else 0, 1)
            }
        
        return {
            "by_mode": mode_effectiveness,
        }
    except Exception as e:
        print(f"Error in get_effectiveness_analytics: {e}")
        return {"by_mode": {}}


# ============== DIET Analytics Endpoints ==============

@router.get("/analytics/classroom-context")
async def get_classroom_context_analytics(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get analytics by classroom context (multigrade, class size) for DIET training redesign - filtered by organization."""
    org_id = current_user.organization_id
    
    # Multigrade vs single-grade distribution - Join with User for org filter
    multigrade_result = await db.execute(
        select(func.count()).select_from(QueryModel).join(User).where(
            QueryModel.is_multigrade == True,
            User.organization_id == org_id
        )
    )
    multigrade_count = multigrade_result.scalar() or 0
    
    single_grade_result = await db.execute(
        select(func.count()).select_from(QueryModel).join(User).where(
            QueryModel.is_multigrade == False,
            User.organization_id == org_id
        )
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
            select(func.count()).select_from(QueryModel).join(User).where(
                QueryModel.class_size >= min_size,
                QueryModel.class_size <= max_size,
                User.organization_id == org_id
            )
        )
        class_size_distribution[name] = result.scalar() or 0
    
    # Success rate by multigrade - Join with User via Query
    multigrade_total = await db.execute(
        select(func.count()).select_from(Reflection).join(
            QueryModel, Reflection.query_id == QueryModel.id
        ).join(User).where(
            QueryModel.is_multigrade == True,
            User.organization_id == org_id
        )
    )
    multigrade_worked = await db.execute(
        select(func.count()).select_from(Reflection).join(
            QueryModel, Reflection.query_id == QueryModel.id
        ).join(User).where(
            QueryModel.is_multigrade == True, 
            Reflection.worked == True,
            User.organization_id == org_id
        )
    )
    mt, mw = multigrade_total.scalar() or 0, multigrade_worked.scalar() or 0
    
    single_total = await db.execute(
        select(func.count()).select_from(Reflection).join(
            QueryModel, Reflection.query_id == QueryModel.id
        ).join(User).where(
            QueryModel.is_multigrade == False,
            User.organization_id == org_id
        )
    )
    single_worked = await db.execute(
        select(func.count()).select_from(Reflection).join(
            QueryModel, Reflection.query_id == QueryModel.id
        ).join(User).where(
            QueryModel.is_multigrade == False, 
            Reflection.worked == True,
            User.organization_id == org_id
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
    """Get aggregate pedagogical sentiment from teacher voice reflections - filtered by organization."""
    org_id = current_user.organization_id
    
    result = await db.execute(
        select(
            Reflection.pedagogical_sentiment,
            func.count().label("count")
        ).join(
            QueryModel, Reflection.query_id == QueryModel.id
        ).join(User).where(
            User.organization_id == org_id,
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
    """Identify training gaps by subject+grade with lowest success rates - filtered by organization."""
    org_id = current_user.organization_id
    
    # Get subjects/grades with low success rates
    try:
        result = await db.execute(
            select(
                QueryModel.subject,
                QueryModel.grade,
                func.count(Reflection.id).label("total_reflections"),
                func.sum(case((Reflection.worked == True, 1), else_=0)).label("worked_count")
            ).join(Reflection).join(User).where(
                User.organization_id == org_id,
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
    except Exception as e:
        print(f"Error in get_training_gaps_analytics: {e}")
        # Return empty if query fails
        return {"training_gaps": [], "total_gaps_identified": 0}
    
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
    """List users in the admin's organization with optional role filter."""
    org_id = current_user.organization_id
    
    # Base query - only users in this organization
    query = select(User).where(User.organization_id == org_id)
    
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
    
    
    return {
        "items": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


# ============== User CRUD ==============
# Schema definitions removed - using centralized schemas from app.schemas.user


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user with hierarchical mapping support."""
    
    # Check if phone already exists
    existing = await db.execute(select(User).where(User.phone == user_data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create user instance
    user = User(
        phone=user_data.phone,
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        language=user_data.language,
        organization_id=current_user.organization_id,
        hashed_password=get_password_hash(user_data.password) if user_data.password else None,
        is_active=True,
        is_verified=False,
        created_by_id=current_user.id,
        
        # Mapping IDs
        state_id=user_data.state_id,
        district_id=user_data.district_id,
        block_id=user_data.block_id,
        cluster_id=user_data.cluster_id,
        school_id=user_data.school_id,
        assigned_arp_id=user_data.assigned_arp_id,
        
        # Context
        grades_taught=user_data.grades_taught,
        subjects_taught=user_data.subjects_taught
    )
    
    # Auto-populate location strings from School/Cluster/Block
    if user_data.school_id:
        result = await db.execute(select(School).where(School.id == user_data.school_id))
        school = result.scalar_one_or_none()
        if school:
            user.school_name = school.name
            # Traverse upwards to fill IDs if missing
            if not user.cluster_id: user.cluster_id = school.cluster_id
            if not user.block_id: user.block_id = school.block_id
            
    if user.cluster_id:
        result = await db.execute(select(Cluster).where(Cluster.id == user.cluster_id))
        cluster = result.scalar_one_or_none()
        if cluster and not user.block_id:
            user.block_id = cluster.block_id
            
    if user.block_id:
        result = await db.execute(select(Block).where(Block.id == user.block_id))
        block = result.scalar_one_or_none()
        if block:
            user.school_block = block.name
            if not user.district_id: user.district_id = block.district_id
            
    if user.district_id:
        result = await db.execute(select(District).where(District.id == user.district_id))
        district = result.scalar_one_or_none()
        if district:
            user.school_district = district.name
            if not user.state_id: user.state_id = district.state_id
            
    if user.state_id:
        result = await db.execute(select(State).where(State.id == user.state_id))
        state = result.scalar_one_or_none()
        if state:
            user.school_state = state.name

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
    
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Update a user with hierarchical mapping support and audit logging."""
    result = await db.execute(
        select(User).where(
            User.id == user_id, 
            User.organization_id == current_user.organization_id
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_values = {}
    new_values = {}
    
    # Update fields and track changes for audit log
    update_dict = user_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if hasattr(user, field):
            old_val = getattr(user, field)
            if old_val != value:
                old_values[field] = str(old_val) if old_val is not None else None
                new_values[field] = str(value) if value is not None else None
                setattr(user, field, value)
        
    # Re-trigger auto-population if mappings changed
    mapping_fields = ["state_id", "district_id", "block_id", "cluster_id", "school_id"]
    if any(k in update_dict for k in mapping_fields):
        # Fetch school if exists
        if user.school_id:
            s_res = await db.execute(select(School).where(School.id == user.school_id))
            school = s_res.scalar_one_or_none()
            if school:
                user.school_name = school.name
                if not user.cluster_id: user.cluster_id = school.cluster_id
                if not user.block_id: user.block_id = school.block_id
                
        # Fetch block for names
        if user.block_id:
            b_res = await db.execute(select(Block).where(Block.id == user.block_id))
            block = b_res.scalar_one_or_none()
            if block:
                user.school_block = block.name
                if not user.district_id: user.district_id = block.district_id
                
        # Fetch district for state
        if user.district_id:
            d_res = await db.execute(select(District).where(District.id == user.district_id))
            district = d_res.scalar_one_or_none()
            if district:
                user.school_district = district.name
                if not user.state_id: user.state_id = district.state_id
                
        if user.state_id:
            st_res = await db.execute(select(State).where(State.id == user.state_id))
            state = st_res.scalar_one_or_none()
            if state:
                user.school_state = state.name

    if new_values:
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            action="user.update",
            resource_type="user",
            resource_id=user.id,
            old_values=old_values,
            new_values=new_values
        )
        db.add(audit)

    await db.commit()
    await db.refresh(user)
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


# ============== Reports ==============

@router.get("/reports/summary")
async def get_reports_summary(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get summary report data - filtered by organization."""
    from app.models.resource import Resource
    
    org_id = current_user.organization_id
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    # Total users in this organization
    total_users_result = await db.execute(
        select(func.count()).where(User.organization_id == org_id)
    )
    total_users = total_users_result.scalar() or 0
    
    # Total teachers in this organization
    teachers_result = await db.execute(
        select(func.count()).where(
            User.role == UserRole.TEACHER,
            User.organization_id == org_id
        )
    )
    total_teachers = teachers_result.scalar() or 0
    
    # Total queries from users in this organization
    total_queries_result = await db.execute(
        select(func.count()).select_from(QueryModel).join(
            User, QueryModel.user_id == User.id
        ).where(User.organization_id == org_id)
    )
    total_queries = total_queries_result.scalar() or 0
    
    # Total resources (org-wide for now)
    try:
        resources_result = await db.execute(select(func.count()).select_from(Resource))
        total_resources = resources_result.scalar() or 0
    except:
        total_resources = 0
    
    # Queries by day (last N days) - filtered by org
    queries_by_day = []
    for i in range(min(days, 7)):
        day = datetime.utcnow().date() - timedelta(days=i)
        result = await db.execute(
            select(func.count()).select_from(QueryModel).join(
                User, QueryModel.user_id == User.id
            ).where(
                func.date(QueryModel.created_at) == day,
                User.organization_id == org_id
            )
        )
        count = result.scalar() or 0
        queries_by_day.append({"date": day.isoformat(), "count": count})
    queries_by_day.reverse()
    
    # Top subjects - filtered by org
    subject_result = await db.execute(
        select(QueryModel.subject, func.count().label("count"))
        .join(User, QueryModel.user_id == User.id)
        .where(
            QueryModel.subject.isnot(None), 
            QueryModel.created_at >= cutoff,
            User.organization_id == org_id
        )
        .group_by(QueryModel.subject)
        .order_by(func.count().desc())
        .limit(5)
    )
    top_subjects = [{"subject": row.subject, "count": row.count} for row in subject_result.all()]
    
    # Top grades - filtered by org
    grade_result = await db.execute(
        select(QueryModel.grade, func.count().label("count"))
        .join(User, QueryModel.user_id == User.id)
        .where(
            QueryModel.grade.isnot(None), 
            QueryModel.created_at >= cutoff,
            User.organization_id == org_id
        )
        .group_by(QueryModel.grade)
        .order_by(func.count().desc())
        .limit(5)
    )
    top_grades = [{"grade": row.grade, "count": row.count} for row in grade_result.all()]
    
    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_queries": total_queries,
        "total_resources": total_resources,
        "queries_by_day": queries_by_day,
        "top_subjects": top_subjects,
        "top_grades": top_grades
    }


# ============== Organization Settings ==============

class OrgSettingsUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None
    storage_provider: Optional[str] = None
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None


@router.get("/organization/settings")
async def get_org_settings(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get organization settings."""
    try:
        from app.models.organization_settings import OrganizationSettings
        
        if current_user.organization_id:
            result = await db.execute(
                select(OrganizationSettings).where(
                    OrganizationSettings.organization_id == current_user.organization_id
                )
            )
            settings = result.scalar_one_or_none()
            if settings:
                # Safely get enum values
                ai_provider = "google"
                storage_provider = "local"
                try:
                    if settings.ai_provider:
                        ai_provider = settings.ai_provider.value if hasattr(settings.ai_provider, 'value') else str(settings.ai_provider)
                    if settings.storage_provider:
                        storage_provider = settings.storage_provider.value if hasattr(settings.storage_provider, 'value') else str(settings.storage_provider)
                except:
                    pass
                    
                return {
                    "id": settings.id,
                    "name": "Gov-Tech AI Teaching",
                    "logo_url": None,
                    "primary_color": "#0D9488",
                    "ai_provider": ai_provider,
                    "ai_model": settings.ai_model or "gemini-1.5-flash",
                    "storage_provider": storage_provider,
                    "email_enabled": False,
                    "sms_enabled": False
                }
    except Exception as e:
        # Log error but don't crash
        print(f"Error loading org settings: {e}")
    
    # Return defaults
    return {
        "id": 1,
        "name": "Gov-Tech AI Teaching",
        "logo_url": None,
        "primary_color": "#0D9488",
        "ai_provider": "google",
        "ai_model": "gemini-1.5-flash",
        "storage_provider": "local",
        "email_enabled": False,
        "sms_enabled": False
    }


@router.put("/organization/settings")
async def update_org_settings(
    data: OrgSettingsUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Update organization settings."""
    # For now just return the data as saved
    return {"message": "Settings updated", **data.model_dump(exclude_unset=True)}


# ============== Bulk User Import ==============

from fastapi import UploadFile, File
import csv
import io


@router.post("/users/bulk-import")
async def bulk_import_users(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Import users from CSV file."""
    content = await file.read()
    text = content.decode('utf-8')
    
    reader = csv.DictReader(io.StringIO(text))
    
    success_count = 0
    failed_count = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            phone = row.get('phone', '').strip()
            name = row.get('name', '').strip()
            role_str = row.get('role', 'TEACHER').strip().upper()
            
            if not phone or len(phone) < 10:
                failed_count += 1
                errors.append(f"Row {row_num}: Invalid phone")
                continue
            
            # Check if user exists
            existing = await db.execute(select(User).where(User.phone == phone))
            if existing.scalar_one_or_none():
                failed_count += 1
                errors.append(f"Row {row_num}: Phone already exists")
                continue
            
            role = UserRole.TEACHER
            if role_str == 'CRP':
                role = UserRole.CRP
            elif role_str == 'ARP':
                role = UserRole.ARP
            
            user = User(
                phone=phone,
                name=name or None,
                role=role,
                organization_id=current_user.organization_id,
                school_name=row.get('school_name', '').strip() or None,
                school_district=row.get('school_district', '').strip() or None,
                school_state=row.get('school_state', '').strip() or None,
                is_active=True,
                is_verified=False
            )
            db.add(user)
            success_count += 1
            
        except Exception as e:
            failed_count += 1
            errors.append(f"Row {row_num}: {str(e)}")
    
    await db.commit()
    
    return {
        "success": success_count,
        "failed": failed_count,
        "errors": errors[:10]  # Return first 10 errors
    }
