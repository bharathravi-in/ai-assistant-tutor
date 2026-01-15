"""
API Routers Package
"""
from app.routers.auth import router as auth_router
from app.routers.teacher import router as teacher_router
from app.routers.crp import router as crp_router
from app.routers.arp import router as arp_router
from app.routers.admin import router as admin_router
from app.routers.ai import router as ai_router
from app.routers.media import router as media_router
from app.routers.alerts import router as alerts_router
from app.routers.billing import router as billing_router
from app.routers.permissions import router as permissions_router
from app.routers.health import router as health_router

__all__ = [
    "auth_router",
    "teacher_router",
    "crp_router",
    "arp_router",
    "admin_router",
    "ai_router",
    "media_router",
    "alerts_router",
    "billing_router",
    "permissions_router",
    "health_router",
]


