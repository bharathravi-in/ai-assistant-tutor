"""
Resource models for Learning Resources functionality.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class ResourceType(str, enum.Enum):
    VIDEO = "video"
    DOCUMENT = "document"
    GUIDE = "guide"
    ACTIVITY = "activity"


class ResourceCategory(str, enum.Enum):
    PEDAGOGY = "pedagogy"
    CLASSROOM = "classroom"
    SUBJECT = "subject"
    ASSESSMENT = "assessment"


class Resource(Base):
    """Learning resource model."""
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(SQLEnum(ResourceType), default=ResourceType.DOCUMENT)
    category = Column(SQLEnum(ResourceCategory), default=ResourceCategory.PEDAGOGY)
    grade = Column(String(50))  # e.g., "Class 1-5", "All"
    subject = Column(String(100))  # e.g., "Mathematics", "General"
    duration = Column(String(50))  # e.g., "15 min", "10 min read"
    content_url = Column(String(500))
    thumbnail_url = Column(String(500))
    
    # Metadata
    author = Column(String(255))
    source = Column(String(255))  # e.g., "NCERT", "DIKSHA"
    tags = Column(Text)  # Comma-separated tags
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Organization scope
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    bookmarks = relationship("ResourceBookmark", back_populates="resource", cascade="all, delete-orphan")
    progress = relationship("ResourceProgress", back_populates="resource", cascade="all, delete-orphan")


class ResourceBookmark(Base):
    """User bookmark for a resource."""
    __tablename__ = "resource_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="resource_bookmarks")
    resource = relationship("Resource", back_populates="bookmarks")


class ResourceProgress(Base):
    """User progress on a resource."""
    __tablename__ = "resource_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    is_completed = Column(Boolean, default=False)
    progress_percent = Column(Integer, default=0)  # 0-100
    last_accessed_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="resource_progress")
    resource = relationship("Resource", back_populates="progress")
