"""
Authentication Router
"""
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token, TokenData
from app.utils.security import verify_password, get_password_hash, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user


def require_role(*roles: UserRole):
    """Dependency to require specific roles."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
        return user
    return role_checker


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if phone already exists
    result = await db.execute(select(User).where(User.phone == user_data.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Create user
    user = User(
        phone=user_data.phone,
        name=user_data.name,
        role=user_data.role,
        language=user_data.language,
        school_name=user_data.school_name,
        school_district=user_data.school_district,
        school_block=user_data.school_block,
        school_state=user_data.school_state,
        grades_taught=user_data.grades_taught,
        subjects_taught=user_data.subjects_taught,
        hashed_password=get_password_hash(user_data.password) if user_data.password else None,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Generate token
    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
    
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Login with phone and password."""
    result = await db.execute(select(User).where(User.phone == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # For demo purposes, allow login without password if no password is set
    if user.hashed_password:
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.get("/languages")
async def get_languages():
    """Get supported languages."""
    from app.config import get_settings
    from app.utils.i18n import get_language_name
    
    settings = get_settings()
    return [
        {"code": lang, "name": get_language_name(lang)}
        for lang in settings.supported_languages_list
    ]


@router.get("/theme")
async def get_theme_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get organization theme settings (accessible by all authenticated users)."""
    try:
        from app.models.organization_settings import OrganizationSettings
        
        if current_user.organization_id:
            result = await db.execute(
                select(OrganizationSettings).where(
                    OrganizationSettings.organization_id == current_user.organization_id
                )
            )
            settings = result.scalar_one_or_none()
            if settings:
                return {
                    "id": settings.id,
                    "name": "Gov-Tech AI Teaching",
                    "logo_url": None,
                    "primary_color": "#264092",  # Default brand color
                    "ai_provider": "litellm",
                    "ai_model": "gemini-pro",
                    "storage_provider": "local",
                    "email_enabled": False,
                    "sms_enabled": False
                }
    except Exception as e:
        print(f"Error loading theme settings: {e}")
    
    # Return defaults
    return {
        "id": 1,
        "name": "Gov-Tech AI Teaching",
        "logo_url": None,
        "primary_color": "#264092",
        "ai_provider": "litellm",
        "ai_model": "gemini-pro",
        "storage_provider": "local",
        "email_enabled": False,
        "sms_enabled": False
    }

