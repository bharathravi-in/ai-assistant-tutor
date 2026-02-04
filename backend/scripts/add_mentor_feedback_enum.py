"""
Add MENTOR_FEEDBACK enum value to the notificationtype enum in PostgreSQL
"""
import asyncio
from sqlalchemy import text
from app.database import engine

async def add_mentor_feedback_enum():
    async with engine.connect() as conn:
        conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            await conn.execute(text("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'MENTOR_FEEDBACK'"))
            print("✅ Added MENTOR_FEEDBACK to notificationtype enum")
        except Exception as e:
            print(f"⚠️ Error: {e}")

if __name__ == "__main__":
    asyncio.run(add_mentor_feedback_enum())
