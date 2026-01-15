"""
ARP Router - For Academic Resource Persons
Pattern analysis, curriculum alignment, and training feedback.
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel, QueryMode
from app.models.reflection import Reflection, CRPResponse
from app.routers.auth import get_current_user, require_role

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
