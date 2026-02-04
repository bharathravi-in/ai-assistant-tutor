"""
Analytics API Router - Real-time metrics and insights
Provides usage stats, engagement metrics, and system-wide analytics
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, case
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query, QueryMode
from app.models.reflection import Reflection
from app.models.teacher_content import TeacherContent, ContentStatus
from app.models.chat import Conversation, ChatMessage
from app.models.config import District
from app.routers.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ===== Teacher Analytics =====

@router.get("/teacher/usage")
async def get_teacher_usage_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get teacher's usage statistics."""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Debug: Check what we're querying
        print(f"[ANALYTICS DEBUG] User ID: {current_user.id}, Days: {days}, Start Date: {start_date}")
        
        # First, let's count ALL queries for this user (no date filter)
        all_queries_result = await db.execute(
            select(func.count(Query.id))
            .where(Query.user_id == current_user.id)
        )
        all_queries = all_queries_result.scalar() or 0
        print(f"[ANALYTICS DEBUG] ALL queries for user {current_user.id}: {all_queries}")
        
        # Total queries with date filter
        total_queries_result = await db.execute(
            select(func.count(Query.id))
            .where(Query.user_id == current_user.id, Query.created_at >= start_date)
        )
        total_queries = total_queries_result.scalar() or 0
        print(f"[ANALYTICS DEBUG] Queries in date range: {total_queries}")
        
        # Queries by mode
        queries_by_mode_result = await db.execute(
            select(Query.mode, func.count(Query.id))
            .where(Query.user_id == current_user.id, Query.created_at >= start_date)
            .group_by(Query.mode)
        )
        queries_by_mode = {mode.value if hasattr(mode, 'value') else str(mode): count for mode, count in queries_by_mode_result}
        
        # Content created
        content_created_result = await db.execute(
            select(func.count(TeacherContent.id))
            .where(TeacherContent.user_id == current_user.id, TeacherContent.created_at >= start_date)
        )
        content_created = content_created_result.scalar() or 0
        
        # Reflections - with error handling for missing data
        try:
            reflections_result = await db.execute(
                select(
                    func.count(Reflection.id),
                    func.count(case((Reflection.worked == True, 1))),
                    func.count(case((Reflection.worked == False, 1)))
                )
                .join(Query, Query.id == Reflection.query_id)
                .where(Query.user_id == current_user.id, Query.created_at >= start_date)
            )
            total_reflections, worked, not_worked = reflections_result.one()
        except Exception:
            total_reflections, worked, not_worked = 0, 0, 0
        
        # Chat conversations - with error handling
        try:
            conversations_result = await db.execute(
                select(func.count(Conversation.id), func.sum(Conversation.message_count))
                .where(Conversation.user_id == current_user.id, Conversation.created_at >= start_date)
            )
            total_conversations, total_messages = conversations_result.one()
        except Exception:
            total_conversations, total_messages = 0, 0
        
        # Daily activity (queries per day)
        daily_activity_result = await db.execute(
            select(
                func.date(Query.created_at).label('date'),
                func.count(Query.id).label('count')
            )
            .where(Query.user_id == current_user.id, Query.created_at >= start_date)
            .group_by(func.date(Query.created_at))
            .order_by(func.date(Query.created_at))
        )
        daily_activity = [{"date": str(date), "queries": count} for date, count in daily_activity_result]
        
        # Most used subjects/topics
        subjects_result = await db.execute(
            select(Query.subject, func.count(Query.id))
            .where(
                Query.user_id == current_user.id,
                Query.created_at >= start_date,
                Query.subject.isnot(None)
            )
            .group_by(Query.subject)
            .order_by(desc(func.count(Query.id)))
            .limit(5)
        )
        top_subjects = [{"subject": subj, "count": count} for subj, count in subjects_result]
        
        return {
            "period_days": days,
            "total_queries": total_queries,
            "all_queries_debug": all_queries,  # Debug: show count without date filter
            "queries_by_mode": queries_by_mode,
            "content_created": content_created,
            "reflections": {
                "total": total_reflections or 0,
                "worked": worked or 0,
                "not_worked": not_worked or 0,
                "success_rate": round((worked / total_reflections * 100) if total_reflections else 0, 1)
            },
            "chat": {
                "conversations": total_conversations or 0,
                "messages": int(total_messages) if total_messages else 0,
                "avg_messages_per_conversation": round((total_messages / total_conversations) if total_conversations else 0, 1)
            },
            "daily_activity": daily_activity,
            "top_subjects": top_subjects
        }
    except Exception as e:
        # Return empty stats on error rather than 500
        print(f"Analytics error: {e}")
        return {
            "period_days": days,
            "total_queries": 0,
            "queries_by_mode": {},
            "content_created": 0,
            "reflections": {"total": 0, "worked": 0, "not_worked": 0, "success_rate": 0},
            "chat": {"conversations": 0, "messages": 0, "avg_messages_per_conversation": 0},
            "daily_activity": [],
            "top_subjects": []
        }


@router.get("/content/engagement")
async def get_content_engagement(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get engagement metrics for teacher's content."""
    try:
        # Content by status
        status_result = await db.execute(
            select(TeacherContent.status, func.count(TeacherContent.id))
            .where(TeacherContent.user_id == current_user.id)
            .group_by(TeacherContent.status)
        )
        by_status = {status.value if hasattr(status, 'value') else str(status): count for status, count in status_result}
        
        # Content by type
        type_result = await db.execute(
            select(TeacherContent.content_type, func.count(TeacherContent.id))
            .where(TeacherContent.user_id == current_user.id)
            .group_by(TeacherContent.content_type)
        )
        by_type = {ctype.value if hasattr(ctype, 'value') else str(ctype): count for ctype, count in type_result}
        
        # Recent content with metadata
        recent_result = await db.execute(
            select(TeacherContent)
            .where(TeacherContent.user_id == current_user.id)
            .order_by(desc(TeacherContent.created_at))
            .limit(10)
        )
        recent_content = recent_result.scalars().all()
        
        recent_list = []
        for content in recent_content:
            recent_list.append({
                "id": content.id,
                "title": content.title,
                "type": content.content_type.value if hasattr(content.content_type, 'value') else str(content.content_type),
                "status": content.status.value if hasattr(content.status, 'value') else str(content.status),
                "views": content.view_count or 0,
                "likes": content.like_count or 0,
                "downloads": content.download_count or 0,
                "created_at": content.created_at.isoformat()
            })
        
        return {
            "by_status": by_status,
            "by_type": by_type,
            "recent_content": recent_list,
            "total_content": sum(by_status.values()) if by_status else 0
        }
    except Exception as e:
        print(f"Content engagement error: {e}")
        return {
            "by_status": {},
            "by_type": {},
            "recent_content": [],
            "total_content": 0
        }


# ===== Admin/CRP/ARP Analytics =====

@router.get("/admin/system-metrics")
async def get_system_metrics(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get system-wide metrics (Admin/CRP/ARP only)."""
    
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CRP, UserRole.ARP]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Filter by user's scope
    if current_user.role == UserRole.CRP:
        # CRP sees their cluster
        user_filter = User.cluster_id == current_user.cluster_id
    elif current_user.role == UserRole.ARP:
        # ARP sees their assigned teachers
        user_filter = User.assigned_arp_id == current_user.id
    else:
        # Admin/Superadmin sees all
        user_filter = True
    
    # Active users
    active_users_result = await db.execute(
        select(func.count(func.distinct(Query.user_id)))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date)
    )
    active_users = active_users_result.scalar() or 0
    
    # Total queries
    total_queries_result = await db.execute(
        select(func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date)
    )
    total_queries = total_queries_result.scalar() or 0
    
    # Queries by mode
    mode_distribution_result = await db.execute(
        select(Query.mode, func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date)
        .group_by(Query.mode)
    )
    mode_distribution = {mode.value: count for mode, count in mode_distribution_result}
    
    # Top performing teachers (most queries)
    top_teachers_result = await db.execute(
        select(User.name, User.id, func.count(Query.id).label('query_count'))
        .join(Query, Query.user_id == User.id)
        .where(user_filter, Query.created_at >= start_date)
        .group_by(User.id, User.name)
        .order_by(desc('query_count'))
        .limit(10)
    )
    top_teachers = [
        {"name": name, "user_id": uid, "queries": count}
        for name, uid, count in top_teachers_result
    ]
    
    # Most popular topics
    popular_topics_result = await db.execute(
        select(Query.topic, func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(
            user_filter,
            Query.created_at >= start_date,
            Query.topic.isnot(None)
        )
        .group_by(Query.topic)
        .order_by(desc(func.count(Query.id)))
        .limit(10)
    )
    popular_topics = [{"topic": topic, "count": count} for topic, count in popular_topics_result]
    
    # Response time averages (if available)
    avg_response_time_result = await db.execute(
        select(func.avg(ChatMessage.response_time_ms))
        .join(Conversation, Conversation.id == ChatMessage.conversation_id)
        .join(User, User.id == Conversation.user_id)
        .where(
            user_filter,
            ChatMessage.role == 'assistant',
            ChatMessage.created_at >= start_date,
            ChatMessage.response_time_ms.isnot(None)
        )
    )
    avg_response_time = avg_response_time_result.scalar() or 0
    
    return {
        "period_days": days,
        "active_users": active_users,
        "total_queries": total_queries,
        "avg_queries_per_user": round(total_queries / active_users, 1) if active_users else 0,
        "mode_distribution": mode_distribution,
        "top_teachers": top_teachers,
        "popular_topics": popular_topics,
        "avg_response_time_ms": int(avg_response_time) if avg_response_time else 0
    }


@router.get("/admin/crp-activity")
async def get_crp_activity(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get CRP monitoring activity (pending approvals, visit stats)."""
    
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CRP]:
        raise HTTPException(status_code=403, detail="CRP/Admin access required")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Filter scope
    if current_user.role == UserRole.CRP:
        user_filter = User.cluster_id == current_user.cluster_id
    else:
        user_filter = True
    
    # Pending content approvals
    pending_content_result = await db.execute(
        select(func.count(TeacherContent.id))
        .join(User, User.id == TeacherContent.user_id)
        .where(user_filter, TeacherContent.status == ContentStatus.PENDING)
    )
    pending_content = pending_content_result.scalar() or 0
    
    # Teachers needing support (low reflection success rate)
    low_success_teachers_result = await db.execute(
        select(User.id, User.name, func.count(Reflection.id).label('total'))
        .join(Query, Query.user_id == User.id)
        .join(Reflection, Reflection.query_id == Query.id)
        .where(
            user_filter,
            Query.created_at >= start_date,
            Reflection.worked == False
        )
        .group_by(User.id, User.name)
        .having(func.count(Reflection.id) >= 3)
        .order_by(desc('total'))
        .limit(10)
    )
    teachers_needing_support = [
        {"user_id": uid, "name": name, "failed_attempts": count}
        for uid, name, count in low_success_teachers_result
    ]
    
    # Recent teacher activity
    recent_activity_result = await db.execute(
        select(User.name, Query.created_at, Query.mode, Query.topic)
        .join(Query, Query.user_id == User.id)
        .where(user_filter, Query.created_at >= start_date)
        .order_by(desc(Query.created_at))
        .limit(20)
    )
    recent_activity = [
        {
            "teacher": name,
            "timestamp": created_at.isoformat(),
            "mode": mode.value,
            "topic": topic or "General"
        }
        for name, created_at, mode, topic in recent_activity_result
    ]
    
    return {
        "pending_approvals": pending_content,
        "teachers_needing_support": teachers_needing_support,
        "recent_activity": recent_activity
    }


@router.get("/arp/gap-analysis")
async def get_arp_gap_analysis(
    time_range: str = 'month',
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed gap analysis for ARP teachers.
    Identifies what teachers are asking vs common curriculum areas.
    """
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.ARP]:
        raise HTTPException(status_code=403, detail="ARP/Admin access required")

    days = 7 if time_range == 'week' else 30 if time_range == 'month' else 90
    start_date = datetime.utcnow() - timedelta(days=days)

    # Filter for ARP's assigned teachers
    user_filter = User.assigned_arp_id == current_user.id if current_user.role == UserRole.ARP else True

    # 1. Basic Counts
    total_queries_res = await db.execute(
        select(func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date)
    )
    total_queries = total_queries_res.scalar() or 0

    unique_teachers_res = await db.execute(
        select(func.count(func.distinct(Query.user_id)))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date)
    )
    unique_teachers = unique_teachers_res.scalar() or 0

    topics_covered_res = await db.execute(
        select(func.count(func.distinct(Query.topic)))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date, Query.topic.isnot(None))
    )
    topics_covered = topics_covered_res.scalar() or 0

    # 2. Common Challenges (Top topics)
    challenges_res = await db.execute(
        select(Query.topic, func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date, Query.topic.isnot(None))
        .group_by(Query.topic)
        .order_by(desc(func.count(Query.id)))
        .limit(5)
    )
    common_challenges = [{"topic": topic, "count": count} for topic, count in challenges_res]

    # 3. Queries by Grade
    grade_res = await db.execute(
        select(Query.grade, func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date, Query.grade.isnot(None))
        .group_by(Query.grade)
        .order_by(Query.grade)
    )
    query_by_grade = [{"grade": int(grade), "count": count} for grade, count in grade_res]

    # 4. Queries by Subject
    subj_res = await db.execute(
        select(Query.subject, func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(user_filter, Query.created_at >= start_date, Query.subject.isnot(None))
        .group_by(Query.subject)
        .order_by(desc(func.count(Query.id)))
    )
    query_by_subject = [{"subject": subj, "count": count} for subj, count in subj_res]

    # 5. Uncovered Topics (Topics asked by others but not this ARP's teachers)
    # This provides insight into what teachers MIGHT be missing or avoiding
    others_filter = User.assigned_arp_id != current_user.id if current_user.role == UserRole.ARP else False
    
    uncovered_res = await db.execute(
        select(Query.topic)
        .join(User, User.id == Query.user_id)
        .where(others_filter, Query.created_at >= start_date, Query.topic.isnot(None))
        .where(Query.topic.notin_(
            select(Query.topic)
            .join(User, User.id == Query.user_id)
            .where(user_filter, Query.created_at >= start_date, Query.topic.isnot(None))
        ))
        .group_by(Query.topic)
        .order_by(desc(func.count(Query.id)))
        .limit(5)
    )
    uncovered_topics = [topic for (topic,) in uncovered_res]

    # 6. Recommendations (Generated based on data)
    recommendations = []
    if common_challenges:
        top_challenge = common_challenges[0]['topic']
        recommendations.append(f"Schedule training session on {top_challenge} for your cluster.")
    
    if len(query_by_subject) > 0:
        least_asked_subj = query_by_subject[-1]['subject']
        recommendations.append(f"Explore why teachers are reporting fewer challenges in {least_asked_subj}.")
    
    if unique_teachers < 10: # Sample threshold
        recommendations.append("Increase teacher engagement by sharing successful AI-generated lesson plans in your newsletter.")

    return {
        "total_queries": total_queries,
        "unique_teachers": unique_teachers,
        "topics_covered": topics_covered,
        "common_challenges": common_challenges,
        "query_by_grade": query_by_grade,
        "query_by_subject": query_by_subject,
        "uncovered_topics": uncovered_topics or ["No major gaps detected currently"],
        "recommendations": recommendations or ["Continue monitoring current teacher engagement levels."]
    }


@router.get("/admin/state-analytics/{state_id}")
async def get_state_analytics(
    state_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    State-level oversight analytics for Admin/Superadmin.
    Aggregates performance and engagement across the state.
    """
    if current_user.role not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="State analytics access restricted")

    start_date = datetime.utcnow() - timedelta(days=days)

    # 1. Aggregated Query Volume
    query_count_res = await db.execute(
        select(func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(User.state_id == state_id, Query.created_at >= start_date)
    )
    total_queries = query_count_res.scalar() or 0

    # 2. Activity by District (Heatmap data)
    district_activity_res = await db.execute(
        select(District.name, func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .join(District, District.id == User.district_id)
        .where(User.state_id == state_id, Query.created_at >= start_date)
        .group_by(District.name)
        .order_by(desc(func.count(Query.id)))
    )
    district_activity = [{"district": name, "count": count} for name, count in district_activity_res]

    # 3. Success Rate by State (Reflections saying 'worked')
    success_res = await db.execute(
        select(
            func.count(case((Reflection.worked == True, 1))),
            func.count(Reflection.id)
        )
        .join(Query, Query.id == Reflection.query_id)
        .join(User, User.id == Query.user_id)
        .where(User.state_id == state_id, Reflection.created_at >= start_date)
    )
    res_vals = success_res.one()
    worked_count = res_vals[0] or 0
    total_reflections = res_vals[1] or 0
    success_rate = round((worked_count / (total_reflections or 1) * 100), 1) if total_reflections else 0

    # 4. Top Topics in State
    topics_res = await db.execute(
        select(Query.topic, func.count(Query.id))
        .join(User, User.id == Query.user_id)
        .where(User.state_id == state_id, Query.created_at >= start_date, Query.topic.isnot(None))
        .group_by(Query.topic)
        .order_by(desc(func.count(Query.id)))
        .limit(5)
    )
    top_topics = [{"topic": topic, "count": count} for topic, count in topics_res]

    return {
        "state_id": state_id,
        "period_days": days,
        "total_queries": total_queries,
        "success_rate": success_rate,
        "district_activity": district_activity,
        "top_topics": top_topics
    }
