"""
Seed script to create SuperAdmin user after database reset.
Run this inside the backend container after database migration.

Usage:
    docker exec -it gov_teaching_backend python /app/scripts/seed_superadmin.py
"""
import asyncio
import sys
sys.path.insert(0, '/app')

from passlib.context import CryptContext
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# SuperAdmin credentials
SUPERADMIN_PHONE = "9999999999"
SUPERADMIN_NAME = "Super Admin"
SUPERADMIN_PASSWORD = "admin@123"  # Change this!

async def create_superadmin():
    async with AsyncSessionLocal() as db:
        # Check if superadmin already exists
        result = await db.execute(
            select(User).where(User.phone == SUPERADMIN_PHONE)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"SuperAdmin already exists: {existing.phone}")
            return
        
        # Create superadmin
        superadmin = User(
            phone=SUPERADMIN_PHONE,
            name=SUPERADMIN_NAME,
            role=UserRole.SUPERADMIN,
            hashed_password=pwd_context.hash(SUPERADMIN_PASSWORD),
            is_active=True,
            is_verified=True
        )
        
        db.add(superadmin)
        await db.commit()
        
        print(f"✅ SuperAdmin created successfully!")
        print(f"   Phone: {SUPERADMIN_PHONE}")
        print(f"   Password: {SUPERADMIN_PASSWORD}")
        print(f"   Role: SUPERADMIN")

if __name__ == "__main__":
    asyncio.run(create_superadmin())
