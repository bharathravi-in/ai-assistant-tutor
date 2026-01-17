"""
Database Configuration and Session Management
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency for getting database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default users if none exist
    await seed_default_users()


async def seed_default_users():
    """Create only SuperAdmin if the database is empty. Other users must be created via proper hierarchy."""
    from passlib.context import CryptContext
    from app.models.user import User, UserRole
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    async with async_session_maker() as session:
        # Check if any users exist
        from sqlalchemy import select, func
        result = await session.execute(select(func.count(User.id)))
        count = result.scalar()
        
        if count > 0:
            return  # Users already exist
        
        print("🌱 Seeding SuperAdmin user...")
        
        # Only create SuperAdmin - no organization required
        # Other users (Admin, ARP, CRP, Teacher) must be created through proper hierarchy:
        # SuperAdmin → creates Org + Admin
        # Admin → creates ARP/CRP
        # ARP/CRP → creates Teachers
        superadmin = User(
            phone="9000000000",
            name="Super Admin",
            role=UserRole.SUPERADMIN,
            hashed_password=pwd_context.hash("admin@123"),
            is_active=True,
            is_verified=True,
        )
        session.add(superadmin)
        
        await session.commit()
        print("✅ SuperAdmin created (phone: 9000000000, password: admin@123)")

