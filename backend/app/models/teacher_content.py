"""
TeacherContent Model - Stores teacher-created educational content
"""
import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, Enum, Text, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY
from app.database import Base


class ContentStatus(str, enum.Enum):
    """Content workflow status."""
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    PROCESSING = "processing"


class ContentType(str, enum.Enum):
    """Type of educational content."""
    LESSON_PLAN = "lesson_plan"
    ACTIVITY = "activity"
    TLM = "tlm"
    ASSESSMENT = "assessment"
    WORKSHEET = "worksheet"
    QUICK_REFERENCE = "quick_reference"
    STUDY_GUIDE = "study_guide"
    EXPLANATION = "explanation"
    OTHER = "other"


class TeacherContent(Base):
    """Model for storing teacher-created educational content."""
    
    __tablename__ = "teacher_content"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Author
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Content Details
    title: Mapped[str] = mapped_column(String(500))
    content_type: Mapped[ContentType] = mapped_column(Enum(ContentType))
    description: Mapped[str] = mapped_column(Text)
    content_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Structured content
    
    # Metadata
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    topic: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    
    # File Storage (PDF, etc.)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # GCP or local path
    pdf_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # Public/signed URL
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Approval Workflow
    status: Mapped[ContentStatus] = mapped_column(Enum(ContentStatus), default=ContentStatus.DRAFT)
    reviewer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Vector Search
    qdrant_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_vectorized: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Engagement Metrics
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Movement Building (Social)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teacher_content.id"), nullable=True)
    remix_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    author = relationship("User", foreign_keys=[author_id], backref="created_content")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    parent = relationship("TeacherContent", remote_side=[id], backref="children")
    
    def __repr__(self) -> str:
        return f"<TeacherContent {self.id}: {self.title[:30]}>"


class ContentLike(Base):
    """Track user likes on content."""
    
    __tablename__ = "content_likes"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("teacher_content.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate likes
    __table_args__ = (
        {'extend_existing': True}
    )
