from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from app.routers.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.utils.file_utils import save_upload_file
import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/media", tags=["Media"])

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a media file (image/document) for AI analysis."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"File type {file.content_type} not supported. Use JPG, PNG, WEBP or PDF."
        )
    
    # Save file
    file_path = await save_upload_file(file)
    
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "url": file_path
    }


# ==================== VOICE UPLOADS ====================

VOICE_UPLOAD_DIR = "/app/uploads/voice"


@router.post("/upload-voice")
async def upload_voice_note(
    file: UploadFile = File(...),
    purpose: str = Form("response"),  # "response" or "reflection"
    current_user: User = Depends(get_current_user)
):
    """
    Upload a voice note for CRP responses or teacher reflections.
    
    Supported formats: audio/mpeg (mp3), audio/wav, audio/webm, audio/ogg
    """
    allowed_types = [
        "audio/mpeg", "audio/wav", "audio/webm", "audio/ogg", 
        "audio/mp3", "audio/x-wav", "audio/x-m4a", "audio/mp4"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Audio type {file.content_type} not supported. Use MP3, WAV, WEBM, or OGG."
        )
    
    # Create directory if not exists
    os.makedirs(VOICE_UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "webm"
    unique_name = f"{purpose}_{current_user.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(VOICE_UPLOAD_DIR, unique_name)
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Calculate duration (approximate based on file size for now)
    file_size_bytes = len(content)
    # Rough estimate: 128kbps = 16KB/s for MP3
    estimated_duration_sec = int(file_size_bytes / 16000)
    
    # Auto-transcribe
    from app.services.transcription import TranscriptionService
    transcription_service = TranscriptionService()
    transcript = await transcription_service.transcribe_audio(f"/uploads/voice/{unique_name}")
    
    return {
        "filename": unique_name,
        "content_type": file.content_type,
        "url": f"/uploads/voice/{unique_name}",
        "duration_sec": estimated_duration_sec,
        "size_bytes": file_size_bytes,
        "purpose": purpose,
        "transcript": transcript
    }


@router.get("/voice/{filename}")
async def get_voice_note(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Get voice note metadata."""
    file_path = os.path.join(VOICE_UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Voice note not found")
    
    file_size = os.path.getsize(file_path)
    
    return {
        "filename": filename,
        "url": f"/uploads/voice/{filename}",
        "size_bytes": file_size,
        "exists": True
    }
