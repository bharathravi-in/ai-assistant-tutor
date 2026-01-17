from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Form
import os
import uuid
from typing import Optional
from ..services.storage import get_storage_provider
from ..routers.auth import get_current_user, require_role
from ..models.user import UserRole

router = APIRouter(prefix="/storage", tags=["storage"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form("general"),
    current_user = Depends(get_current_user)
):
    """
    Upload a file to the configured storage provider.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    try:
        storage = get_storage_provider()
        
        # Generate a unique filename to prevent collisions
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        destination_path = f"{folder}/{unique_filename}"
        
        path = await storage.upload_file(file, destination_path)
        url = storage.get_file_url(path)
        
        return {
            "filename": file.filename,
            "path": path,
            "url": url,
            "content_type": file.content_type
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.delete("/file/{path:path}")
async def delete_file(
    path: str,
    current_user = Depends(require_role([UserRole.ADMIN, UserRole.SUPERADMIN]))
):
    """
    Delete a file from storage (Requires Admin role).
    """
    # Note: StorageProvider interface doesn't have delete yet, 
    # but we can add it if needed.
    pass

@router.get("/signed-url")
async def get_signed_url(
    path: str,
    expiration: int = 60,  # minutes
    current_user = Depends(get_current_user)
):
    """
    Get a signed URL for accessing a private file.
    The path should be the storage path returned during upload.
    """
    try:
        storage = get_storage_provider()
        signed_url = storage.get_signed_url(path, expiration_minutes=expiration)
        return {
            "url": signed_url,
            "path": path,
            "expires_in_minutes": expiration
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate signed URL: {str(e)}"
        )
