import os
import shutil
from abc import ABC, abstractmethod
from typing import Optional, Union
from datetime import timedelta
from fastapi import UploadFile
from google.cloud import storage
from google.oauth2 import service_account
from ..config import get_settings

settings = get_settings()

class StorageProvider(ABC):
    @abstractmethod
    async def upload_file(self, file_data: Union[UploadFile, bytes], destination_path: str, content_type: Optional[str] = None) -> str:
        """Upload a file to the storage and return its path or URL."""
        pass

    @abstractmethod
    def get_file_url(self, file_path: str) -> str:
        """Get the accessible URL for a stored file."""
        pass

    @abstractmethod
    def get_signed_url(self, file_path: str, expiration_minutes: int = 60) -> str:
        """Get a signed/temporary URL for accessing a stored file."""
        pass

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str = "/app/uploads"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    async def upload_file(self, file_data: Union[UploadFile, bytes], destination_path: str, content_type: Optional[str] = None) -> str:
        full_path = os.path.join(self.base_dir, destination_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        # Check if it's a file-like object (has read method) rather than bytes
        if hasattr(file_data, 'read'):
            if hasattr(file_data, 'seek'):
                await file_data.seek(0)
            content = await file_data.read()
            with open(full_path, "wb") as buffer:
                buffer.write(content)
        else:
            with open(full_path, "wb") as buffer:
                buffer.write(file_data)
        
        return destination_path

    def get_file_url(self, file_path: str) -> str:
        # Returns relative path that can be served by FastAPI static mount
        return f"/uploads/{file_path}"

    def get_signed_url(self, file_path: str, expiration_minutes: int = 60) -> str:
        # Local storage doesn't need signed URLs - just return the direct path
        return f"/uploads/{file_path}"

class GCPStorageProvider(StorageProvider):
    def __init__(self):
        self.bucket_name = settings.gcp_storage_bucket
        credentials_path = settings.gcp_storage_credentials
        
        if os.path.exists(credentials_path):
            self.credentials = service_account.Credentials.from_service_account_file(credentials_path)
            self.client = storage.Client(credentials=self.credentials)
        else:
            # Fallback to default credentials (e.g. when running in GCP environment)
            self.credentials = None
            self.client = storage.Client()
        
        self.bucket = self.client.bucket(self.bucket_name)

    async def upload_file(self, file_data: Union[UploadFile, bytes], destination_path: str, content_type: Optional[str] = None) -> str:
        blob = self.bucket.blob(destination_path)
        
        try:
            # Check if it's a file-like object (has read method) rather than bytes
            if hasattr(file_data, 'read'):
                # It's a file-like object (UploadFile or similar)
                if hasattr(file_data, 'seek'):
                    await file_data.seek(0)
                content = await file_data.read()
                if not content_type and hasattr(file_data, 'content_type'):
                    content_type = file_data.content_type or "application/octet-stream"
                else:
                    content_type = content_type or "application/octet-stream"
                # Ensure content is bytes
                if isinstance(content, str):
                    content = content.encode('utf-8')
                blob.upload_from_string(content, content_type=content_type)
            else:
                # file_data is already bytes
                content_type = content_type or "application/octet-stream"
                blob.upload_from_string(file_data, content_type=content_type)
            
            return destination_path
        except Exception as e:
            raise ValueError(f"GCP upload failed: {str(e)}")

    def get_file_url(self, file_path: str) -> str:
        # Return public URL - use get_signed_url for private buckets
        return f"https://storage.googleapis.com/{self.bucket_name}/{file_path}"

    def get_signed_url(self, file_path: str, expiration_minutes: int = 60) -> str:
        """Generate a signed URL for accessing a private GCS file."""
        try:
            blob = self.bucket.blob(file_path)
            
            # Generate signed URL that expires in specified minutes
            url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=expiration_minutes),
                method="GET",
            )
            return url
        except Exception as e:
            print(f"Error generating signed URL: {e}")
            # Fallback to public URL
            return f"https://storage.googleapis.com/{self.bucket_name}/{file_path}"

def get_storage_provider() -> StorageProvider:
    if settings.document_storage_type.lower() == "gcp":
        credentials_path = settings.gcp_storage_credentials
        # Only use GCP if credentials file exists
        if os.path.exists(credentials_path):
            try:
                return GCPStorageProvider()
            except Exception as e:
                print(f"Warning: Failed to initialize GCP storage, falling back to local: {e}")
                return LocalStorageProvider()
        else:
            print(f"Warning: GCP storage configured but credentials not found at {credentials_path}, using local storage")
            return LocalStorageProvider()
    return LocalStorageProvider()

