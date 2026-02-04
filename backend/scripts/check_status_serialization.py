
import asyncio
from sqlalchemy import select
from app.database import engine, async_session_maker
from app.models.teacher_content import TeacherContent, ContentStatus

async def check():
    async with async_session_maker() as session:
        res = await session.execute(select(TeacherContent).limit(1))
        content = res.scalar()
        if content:
            print(f"Content ID: {content.id}, Status: {content.status}")
            print(f"Status type: {type(content.status)}")
            print(f"Status value: {content.status.value if hasattr(content.status, 'value') else 'N/A'}")

if __name__ == "__main__":
    asyncio.run(check())
