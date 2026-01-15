import os
import uuid
from fastapi import UploadFile
from typing import Optional

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile) -> str:
    """Save an uploaded file and return the relative path."""
    file_ext = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        content = await upload_file.read()
        buffer.write(content)
        
    return f"/uploads/{unique_filename}"

def get_file_extension(file_path: str) -> str:
    return os.path.splitext(file_path)[1].lower()

def is_image(file_path: str) -> bool:
    ext = get_file_extension(file_path)
    return ext in [".jpg", ".jpeg", ".png", ".webp"]
