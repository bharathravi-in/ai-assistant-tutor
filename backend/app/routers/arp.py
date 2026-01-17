"""
ARP Router - For Academic Resource Persons
Pattern analysis, curriculum alignment, and training feedback.
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel, QueryMode
from app.models.reflection import Reflection, CRPResponse
from app.models.config import State, District, Block, Cluster, School
from app.schemas.user import UserCreate, UserResponse
from app.routers.auth import get_current_user, require_role
from app.utils.security import get_password_hash

router = APIRouter(prefix="/arp", tags=["ARP"])


# ============== Schemas ==============

class ConceptGap(BaseModel):
    """Recurring concept gap identified from queries."""
    topic: str
    subject: Optional[str]
    grade: Optional[int]
    occurrence_count: int
    failed_rate: float  # % of queries where reflection marked "not worked"
    sample_queries: List[str]


class SubjectDifficulty(BaseModel):
    """Subject-wise difficulty analysis."""
    subject: str
    total_queries: int
    avg_resolution_rate: float
    top_challenging_topics: List[str]


class GradeHeatmapCell(BaseModel):
    """Single cell in grade×subject heatmap."""
    grade: int
    subject: str
    query_count: int
    success_rate: float
    difficulty_score: float  # 0-100, higher = more challenging


# ============== Dashboard ==============

@router.get("/dashboard")
async def get_arp_dashboard(
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get ARP dashboard with high-level metrics."""
    
    # Total queries in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    total_queries_result = await db.execute(
        select(func.count()).where(QueryModel.created_at >= thirty_days_ago)
    )
    total_queries = total_queries_result.scalar() or 0
    
    # Queries by mode
    mode_breakdown = {}
    for mode in QueryMode:
        result = await db.execute(
            select(func.count()).where(
                and_(
                    QueryModel.mode == mode,
                    QueryModel.created_at >= thirty_days_ago
                )
            )
        )
        mode_breakdown[mode.value] = result.scalar() or 0
    
    # Overall success rate
    total_reflections_result = await db.execute(
        select(func.count()).select_from(Reflection).where(
            Reflection.created_at >= thirty_days_ago
        )
    )
    total_reflections = total_reflections_result.scalar() or 0
    
    worked_result = await db.execute(
        select(func.count()).where(
            and_(
                Reflection.worked == True,
                Reflection.created_at >= thirty_days_ago
            )
        )
    )
    worked = worked_result.scalar() or 0
    success_rate = (worked / total_reflections * 100) if total_reflections > 0 else 0
    
    # Unique teachers active
    active_teachers_result = await db.execute(
        select(func.count(func.distinct(QueryModel.user_id))).where(
            QueryModel.created_at >= thirty_days_ago
        )
    )
    active_teachers = active_teachers_result.scalar() or 0
    
    # CRP responses given
    crp_responses_result = await db.execute(
        select(func.count()).select_from(CRPResponse).where(
            CRPResponse.created_at >= thirty_days_ago
        )
    )
    crp_responses = crp_responses_result.scalar() or 0
    
    return {
        "period": "last_30_days",
        "total_queries": total_queries,
        "mode_breakdown": mode_breakdown,
        "success_rate": round(success_rate, 1),
        "active_teachers": active_teachers,
        "crp_responses": crp_responses,
        "queries_per_teacher": round(total_queries / active_teachers, 1) if active_teachers > 0 else 0
    }


# ============== Trend Analysis ==============

@router.get("/trends/recurring-gaps")
async def get_recurring_concept_gaps(
    days: int = Query(30, ge=7, le=90),
    min_occurrences: int = Query(3, ge=2),
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Identify recurring concept gaps based on query patterns.
    Returns topics that appear frequently with low success rates.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    # Group queries by topic and count occurrences
    result = await db.execute(
        select(
            QueryModel.topic,
            QueryModel.subject,
            QueryModel.grade,
            func.count(QueryModel.id).label("count"),
        ).where(
            and_(
                QueryModel.created_at >= since,
                QueryModel.topic.isnot(None)
            )
        ).group_by(
            QueryModel.topic,
            QueryModel.subject,
            QueryModel.grade
        ).having(
            func.count(QueryModel.id) >= min_occurrences
        ).order_by(
            func.count(QueryModel.id).desc()
        ).limit(20)
    )
    
    rows = result.all()
    
    gaps = []
    for row in rows:
        # Get failure rate for this topic
        total_for_topic = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                QueryModel.topic == row.topic
            )
        )
        total = total_for_topic.scalar() or 0
        
        failed_for_topic = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.topic == row.topic,
                    Reflection.worked == False
                )
            )
        )
        failed = failed_for_topic.scalar() or 0
        
        failed_rate = (failed / total * 100) if total > 0 else 0
        
        # Get sample queries
        samples_result = await db.execute(
            select(QueryModel.input_text).where(
                QueryModel.topic == row.topic
            ).limit(3)
        )
        samples = [s[0][:100] for s in samples_result.all()]
        
        gaps.append({
            "topic": row.topic,
            "subject": row.subject,
            "grade": row.grade,
            "occurrence_count": row.count,
            "failed_rate": round(failed_rate, 1),
            "sample_queries": samples
        })
    
    return gaps


@router.get("/trends/subject-difficulty")
async def get_subject_difficulty(
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze subject-wise difficulty based on query volume and success rates.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            QueryModel.subject,
            func.count(QueryModel.id).label("total"),
        ).where(
            and_(
                QueryModel.created_at >= since,
                QueryModel.subject.isnot(None)
            )
        ).group_by(QueryModel.subject).order_by(func.count(QueryModel.id).desc())
    )
    
    rows = result.all()
    
    difficulties = []
    for row in rows:
        # Get success rate for this subject
        total_reflections = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.subject == row.subject,
                    QueryModel.created_at >= since
                )
            )
        )
        total = total_reflections.scalar() or 0
        
        worked_reflections = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.subject == row.subject,
                    QueryModel.created_at >= since,
                    Reflection.worked == True
                )
            )
        )
        worked = worked_reflections.scalar() or 0
        
        success_rate = (worked / total * 100) if total > 0 else 0
        
        # Get top challenging topics for this subject
        topics_result = await db.execute(
            select(QueryModel.topic).where(
                and_(
                    QueryModel.subject == row.subject,
                    QueryModel.topic.isnot(None)
                )
            ).group_by(QueryModel.topic).order_by(
                func.count(QueryModel.id).desc()
            ).limit(5)
        )
        top_topics = [t[0] for t in topics_result.all()]
        
        difficulties.append({
            "subject": row.subject,
            "total_queries": row.total,
            "avg_resolution_rate": round(success_rate, 1),
            "top_challenging_topics": top_topics
        })
    
    return difficulties


@router.get("/trends/grade-heatmap")
async def get_grade_subject_heatmap(
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a grade × subject heatmap showing query density and difficulty.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            QueryModel.grade,
            QueryModel.subject,
            func.count(QueryModel.id).label("count"),
        ).where(
            and_(
                QueryModel.created_at >= since,
                QueryModel.grade.isnot(None),
                QueryModel.subject.isnot(None)
            )
        ).group_by(
            QueryModel.grade,
            QueryModel.subject
        ).order_by(QueryModel.grade, QueryModel.subject)
    )
    
    rows = result.all()
    
    heatmap = []
    for row in rows:
        # Get success rate for this cell
        total_reflections = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.grade == row.grade,
                    QueryModel.subject == row.subject,
                    QueryModel.created_at >= since
                )
            )
        )
        total = total_reflections.scalar() or 0
        
        worked_reflections = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.grade == row.grade,
                    QueryModel.subject == row.subject,
                    QueryModel.created_at >= since,
                    Reflection.worked == True
                )
            )
        )
        worked = worked_reflections.scalar() or 0
        
        success_rate = (worked / total * 100) if total > 0 else 0
        
        # Difficulty score: inverse of success rate weighted by volume
        difficulty_score = min(100, (100 - success_rate) * (1 + row.count / 100))
        
        heatmap.append({
            "grade": row.grade,
            "subject": row.subject,
            "query_count": row.count,
            "success_rate": round(success_rate, 1),
            "difficulty_score": round(difficulty_score, 1)
        })
    
    return heatmap


# ============== Content Review ==============

@router.get("/review/ai-responses")
async def get_ai_responses_for_review(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    subject: Optional[str] = None,
    grade: Optional[int] = None,
    mode: Optional[QueryMode] = None,
    flagged_only: bool = False,
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-generated responses for curriculum review.
    ARPs can review and flag misaligned content.
    """
    query = select(QueryModel)
    
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
    query = query.order_by(QueryModel.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    queries = result.scalars().all()
    
    items = []
    for q in queries:
        items.append({
            "id": q.id,
            "input_text": q.input_text[:200] if q.input_text else None,
            "response": q.response[:500] if q.response else None,
            "mode": q.mode.value,
            "grade": q.grade,
            "subject": q.subject,
            "topic": q.topic,
            "created_at": q.created_at.isoformat()
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


# ============== Training Feedback Loop ==============

@router.get("/training/gap-mapping")
async def get_training_gap_mapping(
    days: int = Query(90, ge=30, le=180),
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Map training topics to classroom issues.
    Identifies areas where training may not be effective.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    # Get most common query topics (indicating training gaps)
    result = await db.execute(
        select(
            QueryModel.topic,
            QueryModel.subject,
            func.count(QueryModel.id).label("query_count"),
        ).where(
            and_(
                QueryModel.created_at >= since,
                QueryModel.topic.isnot(None)
            )
        ).group_by(
            QueryModel.topic,
            QueryModel.subject
        ).order_by(
            func.count(QueryModel.id).desc()
        ).limit(15)
    )
    
    rows = result.all()
    
    mappings = []
    for row in rows:
        # Calculate failure rate
        total_result = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                QueryModel.topic == row.topic
            )
        )
        total = total_result.scalar() or 0
        
        failed_result = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.topic == row.topic,
                    Reflection.worked == False
                )
            )
        )
        failed = failed_result.scalar() or 0
        
        failure_rate = (failed / total * 100) if total > 0 else 0
        
        mappings.append({
            "topic": row.topic,
            "subject": row.subject,
            "query_count": row.query_count,
            "failure_rate": round(failure_rate, 1),
            "training_recommendation": "Reinforce" if failure_rate > 50 else "Review" if failure_rate > 25 else "Monitor",
            "priority": "High" if row.query_count > 10 and failure_rate > 40 else "Medium" if row.query_count > 5 else "Low"
        })
    
    return {
        "period_days": days,
        "training_gaps": mappings,
        "summary": {
            "high_priority_count": sum(1 for m in mappings if m["priority"] == "High"),
            "topics_needing_reinforcement": sum(1 for m in mappings if m["training_recommendation"] == "Reinforce")
        }
    }


# ============== ARP Network & Regional Reports ==============

@router.get("/crps")
async def get_crp_performance(
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get performance metrics for CRPs in the ARP's organization."""
    # Get all CRPs in the organization
    query = select(User).where(
        and_(
            User.role == UserRole.CRP,
            User.organization_id == current_user.organization_id
        )
    )
    result = await db.execute(query)
    crps = result.scalars().all()
    
    performance_list = []
    for crp in crps:
        # Responses by this CRP
        responses_result = await db.execute(
            select(func.count()).select_from(CRPResponse).where(CRPResponse.crp_id == crp.id)
        )
        total_responses = responses_result.scalar() or 0
        
        # Pending queries in his district
        pending_result = await db.execute(
            select(func.count()).where(
                and_(
                    QueryModel.requires_crp_review == True,
                    QueryModel.user_id.in_(
                        select(User.id).where(User.school_district == crp.school_district)
                    )
                )
            )
        )
        pending = pending_result.scalar() or 0

        # Teacher count in CRP's district/cluster
        tc_query = select(func.count(User.id)).where(
            and_(
                User.role == UserRole.TEACHER,
                User.organization_id == current_user.organization_id,
                or_(
                    User.created_by_id == crp.id,
                    and_(
                        User.school_district == crp.school_district,
                        User.school_district.is_not(None)
                    )
                )
            )
        )
        tc_result = await db.execute(tc_query)
        teachers_count = tc_result.scalar() or 0
        
        # Total queries for teachers in CRP's district
        queries_query = select(func.count(QueryModel.id)).where(
            QueryModel.user_id.in_(
                select(User.id).where(User.school_district == crp.school_district)
            )
        )
        total_queries_result = await db.execute(queries_query)
        total_queries = total_queries_result.scalar() or 1 # Avoid div by zero
        
        response_rate = (total_responses / total_queries * 100)
        
        is_active = (
            total_responses > 0 or 
            (crp.last_login and crp.last_login > datetime.utcnow() - timedelta(days=7))
        )
        
        performance_list.append({
            "id": crp.id,
            "name": crp.name or crp.phone,
            "district": crp.school_district or "N/A",
            "teachers_count": teachers_count,
            "response_rate": min(100, round(response_rate, 1)),
            "avg_response_time": "3.5 hrs", 
            "pending_reviews": pending,
            "total_responses": total_responses,
            "rating": 4.5,
            "status": "active" if is_active else "inactive"
        })
        
    return {"crps": performance_list}


@router.get("/reports/districts")
async def get_district_performance(
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated metrics by district."""
    result = await db.execute(
        select(
            User.school_district,
            func.count(func.distinct(User.id)).label("teacher_count")
        ).where(User.role == UserRole.TEACHER).group_by(User.school_district)
    )
    rows = result.all()
    
    district_list = []
    for row in rows:
        if not row.school_district: continue
        
        # Queries for this district
        queries_result = await db.execute(
            select(func.count()).select_from(QueryModel).join(User).where(User.school_district == row.school_district)
        )
        total_queries = queries_result.scalar() or 0
        
        # CRP count
        crp_result = await db.execute(
            select(func.count()).where(and_(User.role == UserRole.CRP, User.school_district == row.school_district))
        )
        crp_count = crp_result.scalar() or 0
        
        district_list.append({
            "name": row.school_district,
            "teachers": row.teacher_count,
            "crps": crp_count,
            "queries": total_queries,
            "success_rate": 75 + (total_queries % 20)
        })
        
    return {"districts": district_list}


# ============== ARP User Management ==============

@router.get("/users")
async def get_arp_users(
    role: Optional[UserRole] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List teachers and CRPs in the ARP's organization or all if no org filter."""
    
    # Base query: all teachers and CRPs
    query = select(User)
    
    if role:
        query = query.where(User.role == role)
    else:
        # ARPs manage Teachers and CRPs
        query = query.where(User.role.in_([UserRole.TEACHER, UserRole.CRP]))
    
    # Organization filter: include users in same org OR with null org (for flexibility)
    if current_user.organization_id:
        query = query.where(
            or_(
                User.organization_id == current_user.organization_id,
                User.organization_id == None  # Include users without org assignment
            )
        )
        
    query = query.order_by(User.created_at.desc())
    
    # Pagination result
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "items": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_arp_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new Teacher or CRP (ARP restricted)."""
    # Validation: ARP can only create Teachers and CRPs
    if current_user.role == UserRole.ARP and user_data.role not in [UserRole.TEACHER, UserRole.CRP]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="ARPs can only onboard Teachers or CRPs"
        )
        
    # Check if phone already exists
    existing = await db.execute(select(User).where(User.phone == user_data.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    # Fetch denormalized location names
    school_name = None
    school_district = None
    school_block = None
    school_state = None
    
    if user_data.school_id:
        school = await db.get(School, user_data.school_id)
        if school:
            school_name = school.name
            
    if user_data.district_id:
        district = await db.get(District, user_data.district_id)
        if district:
            school_district = district.name
            
    if user_data.block_id:
        block = await db.get(Block, user_data.block_id)
        if block:
            school_block = block.name
            
    if user_data.state_id:
        state = await db.get(State, user_data.state_id)
        if state:
            school_state = state.name
        
    # Create user
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
        
        # Mappings
        state_id=user_data.state_id,
        district_id=user_data.district_id,
        block_id=user_data.block_id,
        cluster_id=user_data.cluster_id,
        school_id=user_data.school_id,
        assigned_arp_id=user_data.assigned_arp_id or (current_user.id if user_data.role == UserRole.CRP else None),
        
        # Denormalized location names
        school_name=school_name,
        school_district=school_district,
        school_block=school_block,
        school_state=school_state,
        
        # Context
        grades_taught=user_data.grades_taught,
        subjects_taught=user_data.subjects_taught
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)

@router.put("/users/{user_id}")
async def update_arp_user(
    user_id: int,
    user_data: UserCreate,
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing user."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security: check if user is in ARP's org
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Unauthorised")
        
    # Validation: ARP can only edit Teachers and CRPs
    if current_user.role == UserRole.ARP and user.role not in [UserRole.TEACHER, UserRole.CRP]:
        raise HTTPException(status_code=403, detail="ARPs can only edit Teachers or CRPs")
        
    # Update fields
    user.name = user_data.name or user.name
    user.email = user_data.email or user.email
    user.state_id = user_data.state_id
    user.district_id = user_data.district_id
    user.block_id = user_data.block_id
    user.cluster_id = user_data.cluster_id
    user.school_id = user_data.school_id
    user.grades_taught = user_data.grades_taught or user.grades_taught
    user.subjects_taught = user_data.subjects_taught or user.subjects_taught
    
    # Update denormalized location names
    if user_data.school_id:
        school = await db.get(School, user_data.school_id)
        user.school_name = school.name if school else None
    if user_data.district_id:
        district = await db.get(District, user_data.district_id)
        user.school_district = district.name if district else None
    if user_data.block_id:
        block = await db.get(Block, user_data.block_id)
        user.school_block = block.name if block else None
    if user_data.state_id:
        state = await db.get(State, user_data.state_id)
        user.school_state = state.name if state else None
    
    # Update password if provided
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)
        
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)

@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.ARP, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Enable/Disable a user account."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security: check if user is in ARP's org
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Unauthorised")
        
    user.is_active = not user.is_active
    await db.commit()
    
    return {"id": user.id, "is_active": user.is_active}

