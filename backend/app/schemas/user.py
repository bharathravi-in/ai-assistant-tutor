"""
User Schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.user import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    phone: str = Field(..., min_length=10, max_length=15)
    name: Optional[str] = None
    role: UserRole = UserRole.TEACHER
    language: str = "en"
    school_name: Optional[str] = None
    school_district: Optional[str] = None
    school_block: Optional[str] = None
    school_state: Optional[str] = None
    grades_taught: Optional[List[int]] = None
    subjects_taught: Optional[List[str]] = None
    password: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = None
    language: Optional[str] = None
    school_name: Optional[str] = None
    school_district: Optional[str] = None
    school_block: Optional[str] = None
    school_state: Optional[str] = None
    grades_taught: Optional[List[int]] = None
    subjects_taught: Optional[List[str]] = None


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    phone: str
    name: Optional[str]
    role: UserRole
    language: str
    school_name: Optional[str]
    school_district: Optional[str]
    school_block: Optional[str]
    school_state: Optional[str]
    grades_taught: Optional[List[int]]
    subjects_taught: Optional[List[str]]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""
    phone: str
    password: Optional[str] = None
    otp: Optional[str] = None


class Token(BaseModel):
    """JWT Token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Data stored in JWT token."""
    user_id: int
    role: UserRole
