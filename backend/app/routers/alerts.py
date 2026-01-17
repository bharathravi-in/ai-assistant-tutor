"""
Struggling Teacher Detection and Alert System
"""
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel, QueryMode
from app.models.reflection import Reflection, CRPResponse
from app.routers.auth import require_role

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ============== Schemas ==============

class StrugglingTeacher(BaseModel):
    """Teacher flagged as needing support."""
    teacher_id: int
    teacher_name: Optional[str]
    school_name: Optional[str]
    phone: str
    total_queries: int
    failed_rate: float
    repeated_issues: List[str]
    last_query_date: Optional[str]
    priority: str  # HIGH, MEDIUM, LOW
    recommended_action: str


class AlertStats(BaseModel):
    """Alert dashboard statistics."""
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    total_flagged_teachers: int
    teachers_needing_followup: int


# ============== Alert Detection Logic ==============

async def detect_struggling_teachers(
    db: AsyncSession,
    days: int = 30,
    min_queries: int = 3,
    failure_threshold: float = 50.0
) -> List[dict]:
    """
    Identify teachers who are struggling based on:
    1. High failure rate (reflection.worked == False)
    2. Repeated queries on same topic
    3. Low overall success rate
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    # Get teachers with queries in timeframe
    teachers_query = await db.execute(
        select(
            QueryModel.user_id,
            func.count(QueryModel.id).label("query_count"),
        ).where(
            QueryModel.created_at >= since
        ).group_by(
            QueryModel.user_id
        ).having(
            func.count(QueryModel.id) >= min_queries
        )
    )
    
    teachers = teachers_query.all()
    struggling = []
    
    for row in teachers:
        user_id = row.user_id
        
        # Get user details
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            continue
        
        # Get failure rate
        total_reflections = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.user_id == user_id,
                    QueryModel.created_at >= since
                )
            )
        )
        total = total_reflections.scalar() or 0
        
        failed_reflections = await db.execute(
            select(func.count()).select_from(Reflection).join(QueryModel).where(
                and_(
                    QueryModel.user_id == user_id,
                    QueryModel.created_at >= since,
                    Reflection.worked == False
                )
            )
        )
        failed = failed_reflections.scalar() or 0
        
        failure_rate = (failed / total * 100) if total > 0 else 0
        
        # Get repeated topics (same topic queried multiple times)
        repeated_topics = await db.execute(
            select(QueryModel.topic).where(
                and_(
                    QueryModel.user_id == user_id,
                    QueryModel.created_at >= since,
                    QueryModel.topic.isnot(None)
                )
            ).group_by(QueryModel.topic).having(
                func.count(QueryModel.id) >= 2
            )
        )
        repeated = [t[0] for t in repeated_topics.all()]
        
        # Get last query date
        last_query_result = await db.execute(
            select(QueryModel.created_at).where(
                QueryModel.user_id == user_id
            ).order_by(QueryModel.created_at.desc()).limit(1)
        )
        last_query = last_query_result.scalar()
        
        # Determine priority
        if failure_rate >= 70 or (failure_rate >= 50 and len(repeated) >= 3):
            priority = "HIGH"
            action = "Immediate intervention required - schedule classroom visit"
        elif failure_rate >= 50 or len(repeated) >= 2:
            priority = "MEDIUM"
            action = "Follow up via phone/message within this week"
        elif failure_rate >= failure_threshold:
            priority = "LOW"
            action = "Monitor progress and check on next regular visit"
        else:
            continue  # Not struggling enough to flag
        
        struggling.append({
            "teacher_id": user_id,
            "teacher_name": user.name,
            "school_name": user.school_name,
            "phone": user.phone,
            "total_queries": row.query_count,
            "failed_rate": round(failure_rate, 1),
            "repeated_issues": repeated[:5],  # Limit to top 5
            "last_query_date": last_query.isoformat() if last_query else None,
            "priority": priority,
            "recommended_action": action
        })
    
    # Sort by priority (HIGH first)
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    struggling.sort(key=lambda x: (priority_order[x["priority"]], -x["failed_rate"]))
    
    return struggling


# ============== Alert Endpoints ==============

@router.get("/struggling-teachers")
async def get_struggling_teachers(
    days: int = Query(30, ge=7, le=90),
    priority: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of teachers who are struggling and need CRP intervention.
    
    Detection criteria:
    - High failure rate (worked == False in reflections)
    - Repeated queries on same topics
    - Low overall success rate
    """
    all_struggling = await detect_struggling_teachers(db, days=days)
    
    # Filter by priority if specified
    if priority:
        all_struggling = [t for t in all_struggling if t["priority"] == priority.upper()]
    
    # Paginate
    total = len(all_struggling)
    start = (page - 1) * page_size
    end = start + page_size
    items = all_struggling[start:end]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/stats")
async def get_alert_stats(
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get alert dashboard statistics."""
    struggling = await detect_struggling_teachers(db, days=days)
    
    high = sum(1 for t in struggling if t["priority"] == "HIGH")
    medium = sum(1 for t in struggling if t["priority"] == "MEDIUM")
    low = sum(1 for t in struggling if t["priority"] == "LOW")
    
    # Teachers needing followup (no CRP response in last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    needs_followup = 0
    
    for teacher in struggling:
        # Check if they have recent CRP response
        crp_response_result = await db.execute(
            select(func.count()).select_from(CRPResponse).join(QueryModel).where(
                and_(
                    QueryModel.user_id == teacher["teacher_id"],
                    CRPResponse.created_at >= week_ago
                )
            )
        )
        if crp_response_result.scalar() == 0:
            needs_followup += 1
    
    return {
        "high_priority_count": high,
        "medium_priority_count": medium,
        "low_priority_count": low,
        "total_flagged_teachers": len(struggling),
        "teachers_needing_followup": needs_followup
    }


@router.get("/teacher/{teacher_id}")
async def get_teacher_alert_details(
    teacher_id: int,
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(require_role(UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed alert information for a specific teacher."""
    since = datetime.utcnow() - timedelta(days=days)
    
    # Get teacher
    user_result = await db.execute(select(User).where(User.id == teacher_id))
    teacher = user_result.scalar_one_or_none()
    
    if not teacher:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get all queries with reflections
    queries_result = await db.execute(
        select(QueryModel).where(
            and_(
                QueryModel.user_id == teacher_id,
                QueryModel.created_at >= since
            )
        ).order_by(QueryModel.created_at.desc())
    )
    queries = queries_result.scalars().all()
    
    query_details = []
    for q in queries:
        # Get reflection
        ref_result = await db.execute(
            select(Reflection).where(Reflection.query_id == q.id)
        )
        reflection = ref_result.scalar_one_or_none()
        
        query_details.append({
            "id": q.id,
            "input_text": q.input_text[:100] if q.input_text else None,
            "mode": q.mode.value,
            "topic": q.topic,
            "subject": q.subject,
            "grade": q.grade,
            "created_at": q.created_at.isoformat(),
            "reflection": {
                "tried": reflection.tried,
                "worked": reflection.worked,
                "feedback": reflection.text_feedback
            } if reflection else None
        })
    
    # Calculate summary stats
    total = len(query_details)
    with_reflection = sum(1 for q in query_details if q["reflection"])
    worked = sum(1 for q in query_details if q["reflection"] and q["reflection"]["worked"])
    
    return {
        "teacher": {
            "id": teacher.id,
            "name": teacher.name,
            "phone": teacher.phone,
            "school_name": teacher.school_name,
            "school_district": teacher.school_district
        },
        "summary": {
            "total_queries": total,
            "with_reflection": with_reflection,
            "worked": worked,
            "success_rate": round((worked / with_reflection * 100) if with_reflection > 0 else 0, 1)
        },
        "recent_queries": query_details[:10]
    }
