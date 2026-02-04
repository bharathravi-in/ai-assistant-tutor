
import asyncio
from sqlalchemy import text
from app.database import engine

async def check():
    async with engine.connect() as conn:
        # Check enum labels
        res = await conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'contentstatus'"))
        labels = res.fetchall()
        print(f"Enum labels in DB: {labels}")
        
        # Check existing status values in teacher_content
        res = await conn.execute(text("SELECT status, count(*) FROM teacher_content GROUP BY status"))
        rows = res.fetchall()
        print(f"Existing status values in teacher_content: {rows}")

if __name__ == "__main__":
    asyncio.run(check())
