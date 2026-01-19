"""
Seed data for the resources table.
Run this after database initialization to populate initial resources.
"""
import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.resource import Resource, ResourceType, ResourceCategory


SEED_RESOURCES = [
    {
        "title": "Engaging Students in Multigrade Classrooms",
        "description": "Learn effective strategies to manage and engage students across different grade levels simultaneously.",
        "type": ResourceType.VIDEO,
        "category": ResourceCategory.CLASSROOM,
        "grade": "All",
        "subject": "General",
        "duration": "15 min",
        "is_featured": True,
    },
    {
        "title": "NCERT Activity Ideas for Mathematics",
        "description": "Hands-on activities aligned with NCERT curriculum for making math learning fun and interactive.",
        "type": ResourceType.GUIDE,
        "category": ResourceCategory.SUBJECT,
        "grade": "Class 4-6",
        "subject": "Mathematics",
        "duration": "10 min read",
        "is_featured": True,
    },
    {
        "title": "Formative Assessment Techniques",
        "description": "Quick and effective ways to assess student understanding during lessons without formal tests.",
        "type": ResourceType.DOCUMENT,
        "category": ResourceCategory.ASSESSMENT,
        "grade": "All",
        "subject": "General",
        "duration": "8 min read",
    },
    {
        "title": "Science Experiments with Everyday Materials",
        "description": "Simple science experiments using materials available in rural areas for Class 5-8 students.",
        "type": ResourceType.ACTIVITY,
        "category": ResourceCategory.SUBJECT,
        "grade": "Class 5-8",
        "subject": "Science",
        "duration": "20 min",
    },
    {
        "title": "Positive Discipline Strategies",
        "description": "Non-punitive approaches to maintain classroom discipline while supporting student wellbeing.",
        "type": ResourceType.VIDEO,
        "category": ResourceCategory.CLASSROOM,
        "grade": "All",
        "subject": "General",
        "duration": "12 min",
    },
    {
        "title": "Storytelling for Language Development",
        "description": "Using stories and narratives to build vocabulary and comprehension skills in English and Hindi.",
        "type": ResourceType.GUIDE,
        "category": ResourceCategory.PEDAGOGY,
        "grade": "Class 1-5",
        "subject": "Language",
        "duration": "15 min read",
    },
    {
        "title": "Teaching Fractions with Visual Aids",
        "description": "Use paper folding, diagrams, and real objects to help students understand fractions intuitively.",
        "type": ResourceType.ACTIVITY,
        "category": ResourceCategory.SUBJECT,
        "grade": "Class 3-5",
        "subject": "Mathematics",
        "duration": "25 min",
    },
    {
        "title": "Managing Large Class Sizes",
        "description": "Practical strategies for effective teaching when you have 40+ students in your classroom.",
        "type": ResourceType.VIDEO,
        "category": ResourceCategory.CLASSROOM,
        "grade": "All",
        "subject": "General",
        "duration": "18 min",
    },
    {
        "title": "Project-Based Learning in EVS",
        "description": "Engage students with hands-on environmental science projects using local community resources.",
        "type": ResourceType.GUIDE,
        "category": ResourceCategory.PEDAGOGY,
        "grade": "Class 3-5",
        "subject": "EVS",
        "duration": "20 min read",
    },
    {
        "title": "Creating Rubrics for Fair Assessment",
        "description": "Design clear assessment criteria that students understand and that reduce grading bias.",
        "type": ResourceType.DOCUMENT,
        "category": ResourceCategory.ASSESSMENT,
        "grade": "All",
        "subject": "General",
        "duration": "12 min read",
    },
]


async def seed_resources():
    """Seed the resources table with initial data."""
    async with async_session_maker() as session:
        # Check if resources already exist
        result = await session.execute(select(Resource).limit(1))
        if result.scalar_one_or_none():
            print("Resources already seeded, skipping...")
            return
        
        # Insert seed data
        for data in SEED_RESOURCES:
            resource = Resource(**data, is_active=True)
            session.add(resource)
        
        await session.commit()
        print(f"✅ Seeded {len(SEED_RESOURCES)} resources")


if __name__ == "__main__":
    asyncio.run(seed_resources())
