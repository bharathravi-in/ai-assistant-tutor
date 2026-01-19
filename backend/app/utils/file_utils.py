import os
import uuid
from fastapi import UploadFile
from .encryption import decrypt_value
from ..services.storage import get_storage_provider

async def save_upload_file(upload_file: UploadFile, folder: str = "uploads") -> str:
    """Save an uploaded file and return the accessible URL."""
    storage = get_storage_provider()
    
    file_ext = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    destination_path = f"{folder}/{unique_filename}"
    
    path = await storage.upload_file(upload_file, destination_path)
    return storage.get_file_url(path)

def get_file_extension(file_path: str) -> str:
    return os.path.splitext(file_path)[1].lower()

def is_image(file_path: str) -> bool:
    ext = get_file_extension(file_path)
    return ext in [".jpg", ".jpeg", ".png", ".webp"]
