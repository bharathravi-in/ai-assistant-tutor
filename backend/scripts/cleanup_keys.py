
import os
import sys
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.models.system_settings import SystemSettings
from app.models.organization_settings import OrganizationSettings
from app.utils.encryption import decrypt_value, is_mask, get_encryption_key

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5433/gov_teaching")
# For inside docker, it might be gov_teaching_db:5432
if "gov_teaching_db" not in DATABASE_URL and os.path.exists("/.dockerenv"):
    DATABASE_URL = DATABASE_URL.replace("localhost:5433", "gov_teaching_db:5432")

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def cleanup_keys():
    print(f"--- Cleaning up corrupted API keys ---")
    print(f"Connecting to: {DATABASE_URL}")
    
    async with AsyncSessionLocal() as db:
        # 1. Clean System Settings
        system_settings = await db.scalar(select(SystemSettings).limit(1))
        if system_settings:
            fields = ['openai_api_key', 'gemini_api_key', 'anthropic_api_key', 'azure_openai_key', 'litellm_api_key']
            for field in fields:
                encrypted_val = getattr(system_settings, field)
                if encrypted_val:
                    decrypted = decrypt_value(encrypted_val)
                    if is_mask(decrypted):
                        print(f"⚠️ [System] Corrupted {field} detected (Mask found). Resetting to NULL.")
                        setattr(system_settings, field, None)
        
        # 2. Clean Organization Settings
        result = await db.execute(select(OrganizationSettings))
        org_settings_list = result.scalars().all()
        for org_settings in org_settings_list:
            fields = ['openai_api_key', 'gemini_api_key', 'anthropic_api_key', 'azure_openai_key', 'litellm_api_key']
            for field in fields:
                encrypted_val = getattr(org_settings, field)
                if encrypted_val:
                    decrypted = decrypt_value(encrypted_val)
                    if is_mask(decrypted):
                        print(f"⚠️ [Org {org_settings.organization_id}] Corrupted {field} detected. Resetting to NULL.")
                        setattr(org_settings, field, None)
        
        await db.commit()
        print("\n✅ Cleanup complete. Corrupted keys have been removed.")
        print("Settings will now fallback to environment variables or require re-entry.")

if __name__ == "__main__":
    asyncio.run(cleanup_keys())
