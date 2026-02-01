"""
AI Teaching Platform - Main FastAPI Application
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routers import auth_router, teacher_router, crp_router, arp_router, admin_router, ai_router, media_router, alerts_router, billing_router, permissions_router, health_router, resources_router, storage_router, config_router, content_router
from app.routers.superadmin import router as superadmin_router
from app.routers.settings import router as settings_router
from app.routers.feedback import router as feedback_router
from app.routers.surveys import router as surveys_router
from app.routers.programs import router as programs_router
from app.routers.chat import router as chat_router
from app.routers.analytics import router as analytics_router
from app.routers.notifications import router as notifications_router
from app.routers.learning import router as learning_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("🚀 Starting AI Teaching Platform...")
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.app_name,
    description="AI-Enabled Just-in-Time Teaching & Classroom Support Platform for Government School Teachers",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(teacher_router, prefix="/api")
app.include_router(crp_router, prefix="/api")
app.include_router(arp_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(permissions_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(superadmin_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(media_router, prefix="/api")
app.include_router(resources_router, prefix="/api")
app.include_router(storage_router, prefix="/api")
# New role-based feature routers
app.include_router(feedback_router, prefix="/api")
app.include_router(surveys_router, prefix="/api")
app.include_router(programs_router, prefix="/api")
app.include_router(config_router, prefix="/api")
# Content creation with approval workflow
app.include_router(content_router, prefix="/api")
# Chat/Conversation interface with context memory
app.include_router(chat_router, prefix="/api")
# Real-time analytics and insights
app.include_router(analytics_router, prefix="/api")
# Push notifications and alerts
app.include_router(notifications_router, prefix="/api")
# Micro-learning modules and scenario templates
app.include_router(learning_router, prefix="/api")



# Mount static files for uploads - create directories first
uploads_dir = "/app/uploads"
for subdir in ["", "general", "resources", "audio", "media", "voices"]:
    path = os.path.join(uploads_dir, subdir)
    os.makedirs(path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "llm_provider": settings.llm_provider,
    }


@app.get("/api/config")
async def get_config():
    """Get public configuration."""
    return {
        "supported_languages": settings.supported_languages_list,
        "default_language": settings.default_language,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
