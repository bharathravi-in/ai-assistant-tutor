"""
User Model
"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Enum, Text, JSON, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserRole(str, enum.Enum):
    """User roles in the system."""
    TEACHER = "TEACHER"
    CRP = "CRP"  # Cluster Resource Person
    ARP = "ARP"  # Academic Resource Person
    ADMIN = "ADMIN"  # Organization admin
    SUPERADMIN = "SUPERADMIN"  # Platform superadmin
    STUDENT = "STUDENT"  # Student learner


class User(Base):
    """User model for teachers, CRPs, ARPs, admins, and superadmins."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Organization (multi-tenant)
    organization_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Basic Info
    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.TEACHER)
    language: Mapped[str] = mapped_column(String(10), default="en")
    
    # School Information (for teachers)
    school_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True
    )
    cluster_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("clusters.id", ondelete="SET NULL"), nullable=True
    )
    block_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("blocks.id", ondelete="SET NULL"), nullable=True
    )
    district_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True
    )
    state_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("states.id", ondelete="SET NULL"), nullable=True
    )
    
    # Text fallbacks/denormalized info (keeping for compatibility)
    school_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    school_district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    school_block: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    school_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Teaching Context
    grades_taught: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # e.g., [1, 2, 3]
    subjects_taught: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # e.g., ["Math", "Science"]
    
    # Authentication
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Created by (for tracking who created this user - e.g., CRP creates teacher)
    created_by_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Assigned ARP (for CRPs)
    assigned_arp_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    queries = relationship("Query", back_populates="user", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<User {self.phone} ({self.role.value})>"
    
    @property
    def is_superadmin(self) -> bool:
        """Check if user is a superadmin."""
        return self.role == UserRole.SUPERADMIN
    
    @property
    def is_org_admin(self) -> bool:
        """Check if user is an organization admin."""
        return self.role == UserRole.ADMIN
    
    @property
    def display_name(self) -> str:
        """Get display name or fallback to phone."""
        return self.name or self.phone
