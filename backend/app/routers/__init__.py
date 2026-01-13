"""
API Routers Package
"""
from app.routers.auth import router as auth_router
from app.routers.teacher import router as teacher_router
from app.routers.crp import router as crp_router
from app.routers.admin import router as admin_router
from app.routers.ai import router as ai_router

__all__ = [
    "auth_router",
    "teacher_router",
    "crp_router",
    "admin_router",
    "ai_router",
]


