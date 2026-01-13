"""
User Settings Router - API endpoints for voice preferences and custom voices
"""
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models import User, UserSettings, CustomVoice
from app.routers.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])


# Pydantic schemas
class VoiceSettingsUpdate(BaseModel):
    selected_voice: Optional[str] = None
    voice_rate: Optional[float] = None
    voice_pitch: Optional[float] = None
    auto_play_response: Optional[bool] = None


class CustomVoiceResponse(BaseModel):
    id: str
    name: str
    gender: str
    audioUrl: Optional[str]
    createdAt: str


class SettingsResponse(BaseModel):
    selectedVoice: str
    voiceRate: float
    voicePitch: float
    autoPlayResponse: bool
    customVoices: List[CustomVoiceResponse]


# Helper to get or create user settings
async def get_or_create_settings(db: AsyncSession, user_id: int) -> UserSettings:
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()
    
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    
    return settings


@router.get("", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's settings including custom voices."""
    settings = await get_or_create_settings(db, current_user.id)
    
    # Get custom voices
    result = await db.execute(
        select(CustomVoice)
        .where(CustomVoice.user_id == current_user.id)
        .order_by(CustomVoice.created_at.desc())
    )
    custom_voices = result.scalars().all()
    
    return SettingsResponse(
        selectedVoice=settings.selected_voice,
        voiceRate=settings.voice_rate,
        voicePitch=settings.voice_pitch,
        autoPlayResponse=settings.auto_play_response,
        customVoices=[
            CustomVoiceResponse(
                id=f"custom-{v.id}",
                name=v.name,
                gender=v.gender,
                audioUrl=v.audio_url,
                createdAt=v.created_at.isoformat()
            )
            for v in custom_voices
        ]
    )


@router.put("")
async def update_settings(
    data: VoiceSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's voice settings."""
    settings = await get_or_create_settings(db, current_user.id)
    
    if data.selected_voice is not None:
        settings.selected_voice = data.selected_voice
    if data.voice_rate is not None:
        settings.voice_rate = data.voice_rate
    if data.voice_pitch is not None:
        settings.voice_pitch = data.voice_pitch
    if data.auto_play_response is not None:
        settings.auto_play_response = data.auto_play_response
    
    await db.commit()
    await db.refresh(settings)
    
    return {"message": "Settings updated successfully"}


@router.post("/voices")
async def create_custom_voice(
    name: str,
    gender: str = "male",
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a custom voice audio file."""
    # Validate file type
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    # Create uploads directory if it doesn't exist
    upload_dir = "/app/uploads/voices"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = audio.filename.split(".")[-1] if audio.filename and "." in audio.filename else "webm"
    filename = f"{current_user.id}_{uuid.uuid4()}.{file_ext}"
    filepath = os.path.join(upload_dir, filename)
    
    # Save file
    content = await audio.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Create database entry
    custom_voice = CustomVoice(
        user_id=current_user.id,
        name=name,
        gender=gender,
        audio_filename=filename,
        audio_url=f"/uploads/voices/{filename}"
    )
    db.add(custom_voice)
    await db.commit()
    await db.refresh(custom_voice)
    
    return CustomVoiceResponse(
        id=f"custom-{custom_voice.id}",
        name=custom_voice.name,
        gender=custom_voice.gender,
        audioUrl=custom_voice.audio_url,
        createdAt=custom_voice.created_at.isoformat()
    )


@router.delete("/voices/{voice_id}")
async def delete_custom_voice(
    voice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom voice."""
    result = await db.execute(
        select(CustomVoice)
        .where(CustomVoice.id == voice_id)
        .where(CustomVoice.user_id == current_user.id)
    )
    voice = result.scalar_one_or_none()
    
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    
    # Delete file
    filepath = f"/app/uploads/voices/{voice.audio_filename}"
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Delete from database
    await db.delete(voice)
    await db.commit()
    
    return {"message": "Voice deleted successfully"}
