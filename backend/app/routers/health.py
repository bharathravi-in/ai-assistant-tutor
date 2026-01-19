"""
System Health Dashboard - Real-time metrics and service status
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import asyncio
import os
import psutil

from app.database import get_db
from app.models.user import User, UserRole
from app.models.query import Query as QueryModel
from app.routers.auth import require_role

router = APIRouter(prefix="/health", tags=["System Health"])


# ============== Basic Health Check ==============

@router.get("/")
async def health_check():
    """Basic health check endpoint - no auth required."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness probe - checks if all dependencies are available."""
    checks = {}
    all_healthy = True
    
    # Database check
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = {"status": "healthy", "latency_ms": 0}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "error": str(e)}
        all_healthy = False
    
    # Redis check
    try:
        import aioredis
        from app.config import get_settings
        settings = get_settings()
        redis = await aioredis.from_url(settings.redis_url)
        start = datetime.utcnow()
        await redis.ping()
        latency = (datetime.utcnow() - start).total_seconds() * 1000
        checks["redis"] = {"status": "healthy", "latency_ms": round(latency, 2)}
        await redis.close()
    except Exception as e:
        checks["redis"] = {"status": "degraded", "error": str(e)}
        # Redis is optional, don't fail health check
    
    return {
        "status": "ready" if all_healthy else "not_ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }


# ============== System Metrics ==============

@router.get("/metrics")
async def get_system_metrics(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get system-level metrics."""
    # Process metrics
    process = psutil.Process(os.getpid())
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "process": {
            "pid": process.pid,
            "memory_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "cpu_percent": process.cpu_percent(),
            "threads": process.num_threads(),
            "open_files": len(process.open_files()),
            "uptime_seconds": (datetime.utcnow() - datetime.fromtimestamp(process.create_time())).total_seconds()
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_available_mb": round(psutil.virtual_memory().available / 1024 / 1024, 2),
            "disk_percent": psutil.disk_usage("/").percent
        }
    }


@router.get("/dashboard")
async def get_health_dashboard(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive health dashboard for SuperAdmins."""
    from app.models.organization import Organization
    from app.models.reflection import Reflection
    
    now = datetime.utcnow()
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(days=1)
    
    # Query metrics
    queries_last_hour = await db.scalar(
        select(func.count()).where(QueryModel.created_at >= hour_ago)
    )
    queries_last_day = await db.scalar(
        select(func.count()).where(QueryModel.created_at >= day_ago)
    )
    
    # Average response time
    avg_response_time = await db.scalar(
        select(func.avg(QueryModel.processing_time_ms)).where(
            QueryModel.created_at >= day_ago,
            QueryModel.processing_time_ms.isnot(None)
        )
    )
    
    # Active users
    active_users = await db.scalar(
        select(func.count(func.distinct(QueryModel.user_id))).where(
            QueryModel.created_at >= day_ago
        )
    )
    
    # Organization stats
    total_orgs = await db.scalar(select(func.count(Organization.id)))
    active_orgs = await db.scalar(
        select(func.count(Organization.id)).where(Organization.is_active == True)
    )
    
    # Success rate (worked reflections)
    total_reflections = await db.scalar(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.created_at >= day_ago
        )
    )
    worked_reflections = await db.scalar(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.created_at >= day_ago,
            Reflection.worked == True
        )
    )
    
    # Error rate (approximate - queries with no response)
    error_count = await db.scalar(
        select(func.count()).where(
            QueryModel.created_at >= day_ago,
            QueryModel.response_text.is_(None)
        )
    )
    
    return {
        "timestamp": now.isoformat(),
        "period": "24h",
        "queries": {
            "last_hour": queries_last_hour or 0,
            "last_day": queries_last_day or 0,
            "avg_response_time_ms": round(avg_response_time or 0, 2),
            "error_rate_percent": round((error_count / queries_last_day * 100) if queries_last_day else 0, 2)
        },
        "users": {
            "active_last_day": active_users or 0,
            "total": await db.scalar(select(func.count(User.id)))
        },
        "organizations": {
            "total": total_orgs or 0,
            "active": active_orgs or 0
        },
        "ai_effectiveness": {
            "total_reflections": total_reflections or 0,
            "worked": worked_reflections or 0,
            "success_rate_percent": round((worked_reflections / total_reflections * 100) if total_reflections else 0, 1)
        }
    }


# ============== Service Status ==============

@router.get("/services")
async def get_service_status(
    current_user: User = Depends(require_role(UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get status of all backend services."""
    services = {}
    
    # Database
    try:
        start = datetime.utcnow()
        await db.execute(text("SELECT 1"))
        latency = (datetime.utcnow() - start).total_seconds() * 1000
        services["postgresql"] = {
            "status": "operational",
            "latency_ms": round(latency, 2),
            "message": "Database responding normally"
        }
    except Exception as e:
        services["postgresql"] = {
            "status": "down",
            "error": str(e),
            "message": "Database connection failed"
        }
    
    # Redis
    try:
        import aioredis
        from app.config import get_settings
        settings = get_settings()
        redis = await aioredis.from_url(settings.redis_url)
        start = datetime.utcnow()
        await redis.ping()
        latency = (datetime.utcnow() - start).total_seconds() * 1000
        info = await redis.info()
        services["redis"] = {
            "status": "operational",
            "latency_ms": round(latency, 2),
            "connected_clients": info.get("connected_clients", 0),
            "used_memory_mb": round(info.get("used_memory", 0) / 1024 / 1024, 2)
        }
        await redis.close()
    except Exception as e:
        services["redis"] = {
            "status": "degraded",
            "error": str(e),
            "message": "Redis not available - caching disabled"
        }
    
    # AI Provider
    try:
        from app.config import get_settings
        settings = get_settings()
        services["ai_provider"] = {
            "status": "operational",
            "provider": settings.llm_provider,
            "message": f"Using {settings.llm_provider} as AI provider"
        }
    except Exception as e:
        services["ai_provider"] = {
            "status": "degraded",
            "error": str(e)
        }
    
    # Storage
    upload_dir = "/app/uploads"
    try:
        if os.path.exists(upload_dir):
            disk_usage = psutil.disk_usage(upload_dir)
            services["storage"] = {
                "status": "operational",
                "path": upload_dir,
                "used_gb": round(disk_usage.used / 1024 / 1024 / 1024, 2),
                "free_gb": round(disk_usage.free / 1024 / 1024 / 1024, 2),
                "percent_used": disk_usage.percent
            }
        else:
            services["storage"] = {
                "status": "degraded",
                "message": "Upload directory not found"
            }
    except Exception as e:
        services["storage"] = {"status": "unknown", "error": str(e)}
    
    # Overall status
    all_statuses = [s["status"] for s in services.values()]
    if all(s == "operational" for s in all_statuses):
        overall = "operational"
    elif any(s == "down" for s in all_statuses):
        overall = "down"
    else:
        overall = "degraded"
    
    return {
        "overall_status": overall,
        "timestamp": datetime.utcnow().isoformat(),
        "services": services
    }


# ============== Query Rate Monitoring ==============

@router.get("/rates")
async def get_query_rates(
    hours: int = Query(24, ge=1, le=168),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get query rates over time for monitoring."""
    now = datetime.utcnow()
    since = now - timedelta(hours=hours)
    
    # Group by hour
    result = await db.execute(
        select(
            func.date_trunc('hour', QueryModel.created_at).label('hour'),
            func.count().label('count'),
            func.avg(QueryModel.processing_time_ms).label('avg_time')
        ).where(
            QueryModel.created_at >= since
        ).group_by(
            func.date_trunc('hour', QueryModel.created_at)
        ).order_by(
            func.date_trunc('hour', QueryModel.created_at)
        )
    )
    
    data = []
    for row in result.all():
        data.append({
            "hour": row.hour.isoformat() if row.hour else None,
            "query_count": row.count,
            "avg_response_time_ms": round(row.avg_time or 0, 2)
        })
    
    return {
        "period_hours": hours,
        "data": data,
        "total_queries": sum(d["query_count"] for d in data)
    }
