
import asyncio
from sqlalchemy import text
from app.database import engine

async def apply_fixes():
    async with engine.begin() as conn:
        print("🚀 Applying database schema fixes...")
        
        # 1. Update teacher_content table
        print("Updating teacher_content table...")
        try:
            await conn.execute(text("ALTER TABLE teacher_content ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES teacher_content(id)"))
            await conn.execute(text("ALTER TABLE teacher_content ADD COLUMN IF NOT EXISTS remix_count INTEGER DEFAULT 0"))
            print("✅ teacher_content table updated.")
        except Exception as e:
            print(f"⚠️ Error updating teacher_content: {e}")
            
        # 2. Update queries table (Indexes)
        print("Updating queries table indexes...")
        try:
            # We use CREATE INDEX IF NOT EXISTS (supported in PG 9.5+)
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_queries_grade ON queries (grade)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_queries_subject ON queries (subject)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_queries_topic ON queries (topic)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_queries_created_at ON queries (created_at)"))
            print("✅ queries indexes created.")
        except Exception as e:
            print(f"⚠️ Error creating indexes: {e}")

if __name__ == "__main__":
    asyncio.run(apply_fixes())
