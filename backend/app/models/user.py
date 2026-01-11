"""
User Model
"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserRole(str, enum.Enum):
    """User roles in the system."""
    TEACHER = "teacher"
    CRP = "crp"  # Cluster Resource Person
    ARP = "arp"  # Academic Resource Person
    ADMIN = "admin"


class User(Base):
    """User model for teachers, CRPs, ARPs, and admins."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.TEACHER)
    language: Mapped[str] = mapped_column(String(10), default="en")
    
    # School Information
    school_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    school_district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    school_block: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    school_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Teaching Context
    grades_taught: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # e.g., [1, 2, 3]
    subjects_taught: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # e.g., ["Math", "Science"]
    
    # Authentication
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    queries = relationship("Query", back_populates="user", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<User {self.phone} ({self.role.value})>"
