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
from app.routers import auth_router, teacher_router, crp_router, arp_router, admin_router, ai_router, media_router, alerts_router, billing_router, permissions_router, health_router
from app.routers.superadmin import router as superadmin_router
from app.routers.settings import router as settings_router

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




# Mount static files for uploads
uploads_dir = "/app/uploads"
os.makedirs(uploads_dir, exist_ok=True)
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
