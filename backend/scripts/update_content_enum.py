
import asyncio
from sqlalchemy import text
from app.database import engine

async def update_enum():
    # Use connect() instead of begin() to avoid automatic transaction blocks
    # which 'ALTER TYPE ... ADD VALUE' doesn't like in some PG configurations.
    async with engine.connect() as conn:
        print("🚀 Updating ContentStatus enum...")
        try:
            # We need to set isolation level to AUTOCOMMIT for this to work
            # in some environments, but SQLAlchemy async engine handling is specific.
            # Using execution_options(isolation_level="AUTOCOMMIT")
            conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
            # Standardize labels to lowercase to match SQLAlchemy models
            await conn.execute(text("ALTER TYPE contentstatus ADD VALUE IF NOT EXISTS 'processing'"))
            await conn.execute(text("ALTER TYPE contentstatus ADD VALUE IF NOT EXISTS 'published'"))
            print("✅ ContentStatus enum updated to 'processing' and 'published'.")
        except Exception as e:
            # If it fails due to transaction, it might be safer to just use text-based check
            print(f"⚠️ Error updating enum: {e}")

if __name__ == "__main__":
    asyncio.run(update_enum())
