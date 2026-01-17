"""
User Schemas
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.models.user import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user with hierarchy support."""
    phone: str = Field(..., min_length=10, max_length=15)
    name: Optional[str] = None
    email: Optional[str] = None
    role: UserRole = UserRole.TEACHER
    language: str = "en"
    password: Optional[str] = None
    
    # Hierarchy Mappings
    state_id: Optional[int] = None
    district_id: Optional[int] = None
    block_id: Optional[int] = None
    cluster_id: Optional[int] = None
    school_id: Optional[int] = None
    assigned_arp_id: Optional[int] = None
    
    # Context (for teachers)
    grades_taught: Optional[List[int]] = None
    subjects_taught: Optional[List[str]] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = None
    email: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Mappings
    state_id: Optional[int] = None
    district_id: Optional[int] = None
    block_id: Optional[int] = None
    cluster_id: Optional[int] = None
    school_id: Optional[int] = None
    assigned_arp_id: Optional[int] = None
    
    # Context
    grades_taught: Optional[List[int]] = None
    subjects_taught: Optional[List[str]] = None


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    phone: str
    name: Optional[str]
    email: Optional[str]
    role: UserRole
    language: str
    
    # Mappings
    state_id: Optional[int]
    district_id: Optional[int]
    block_id: Optional[int]
    cluster_id: Optional[int]
    school_id: Optional[int]
    assigned_arp_id: Optional[int]
    
    # Denormalized compat fields
    school_name: Optional[str]
    school_district: Optional[str]
    school_block: Optional[str]
    school_state: Optional[str]
    
    grades_taught: Optional[Any] = None
    subjects_taught: Optional[Any] = None
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
