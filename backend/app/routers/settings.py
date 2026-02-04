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
from app.services.storage import get_storage_provider

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
                # Use proxy endpoint for secure access instead of direct GCS URL
                audioUrl=f"/api/settings/voices/{v.id}/stream",
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
    
    storage = get_storage_provider()
    
    # Generate unique filename
    file_ext = audio.filename.split(".")[-1] if audio.filename and "." in audio.filename else "webm"
    filename = f"{current_user.id}_{uuid.uuid4()}.{file_ext}"
    destination_path = f"voices/{filename}"
    
    # Upload to storage
    path = await storage.upload_file(audio, destination_path, content_type=audio.content_type)
    url = storage.get_file_url(path)
    
    # Create database entry
    custom_voice = CustomVoice(
        user_id=current_user.id,
        name=name,
        gender=gender,
        audio_filename=filename,
        audio_url=url
    )
    db.add(custom_voice)
    await db.commit()
    await db.refresh(custom_voice)
    
    return CustomVoiceResponse(
        id=f"custom-{custom_voice.id}",
        name=custom_voice.name,
        gender=custom_voice.gender,
        # Use proxy endpoint for secure access
        audioUrl=f"/api/settings/voices/{custom_voice.id}/stream",
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
    
    # Delete file logic can be added to StorageProvider if needed
    # For now, we mainly focus on upload being cloud-agnostic
    
    # Delete from database
    await db.delete(voice)
    await db.commit()
    
    return {"message": "Voice deleted successfully"}


@router.get("/voices/{voice_id}/stream")
async def stream_custom_voice(
    voice_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stream a custom voice audio file.
    Only the owner of the voice can access it.
    """
    from fastapi.responses import StreamingResponse
    import httpx
    
    # Verify ownership
    result = await db.execute(
        select(CustomVoice)
        .where(CustomVoice.id == voice_id)
        .where(CustomVoice.user_id == current_user.id)
    )
    voice = result.scalar_one_or_none()
    
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found or access denied")
    
    if not voice.audio_url:
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # Get storage provider to fetch the file
    storage = get_storage_provider()
    
    try:
        # For GCS, use signed URLs or direct download
        if hasattr(storage, 'get_signed_url'):
            # Use signed URL for secure temporary access
            signed_url = storage.get_signed_url(f"voices/{voice.audio_filename}")
            async with httpx.AsyncClient() as client:
                response = await client.get(signed_url)
                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to fetch audio file")
                
                content_type = response.headers.get("content-type", "audio/webm")
                return StreamingResponse(
                    iter([response.content]),
                    media_type=content_type,
                    headers={
                        "Content-Disposition": f'inline; filename="{voice.name}.webm"',
                        "Cache-Control": "private, max-age=3600"
                    }
                )
        else:
            # Fallback: try to fetch directly from the stored URL
            async with httpx.AsyncClient() as client:
                response = await client.get(voice.audio_url)
                if response.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to fetch audio file")
                
                content_type = response.headers.get("content-type", "audio/webm")
                return StreamingResponse(
                    iter([response.content]),
                    media_type=content_type,
                    headers={
                        "Content-Disposition": f'inline; filename="{voice.name}.webm"',
                        "Cache-Control": "private, max-age=3600"
                    }
                )
    except Exception as e:
        print(f"Error streaming voice file: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream audio file")

