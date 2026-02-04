
import asyncio
from sqlalchemy import text
from app.database import engine

async def check():
    async with engine.connect() as conn:
        # Check teacher_content
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'teacher_content'"))
        columns = [row[0] for row in result]
        print(f"teacher_content columns: {columns}")
        
        # Check queries
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'queries'"))
        columns = [row[0] for row in result]
        print(f"queries columns: {columns}")

if __name__ == "__main__":
    asyncio.run(check())
