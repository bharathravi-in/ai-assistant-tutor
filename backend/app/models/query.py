"""
Query Model - Stores teacher queries and AI responses
"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Enum, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class QueryMode(str, enum.Enum):
    """AI interaction modes."""
    EXPLAIN = "explain"  # Explain how to teach a concept
    ASSIST = "assist"    # Classroom management assistance
    PLAN = "plan"        # Lesson planning


class Query(Base):
    """Query model for storing teacher questions and AI responses."""
    
    __tablename__ = "queries"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Query Details
    mode: Mapped[QueryMode] = mapped_column(Enum(QueryMode))
    input_text: Mapped[str] = mapped_column(Text)
    input_language: Mapped[str] = mapped_column(String(10), default="en")
    voice_input_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Context
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    topic: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # AI Response
    ai_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_language: Mapped[str] = mapped_column(String(10), default="en")
    response_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Processing
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    llm_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    llm_model: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Status
    is_resolved: Mapped[bool] = mapped_column(default=False)
    requires_crp_review: Mapped[bool] = mapped_column(default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="queries")
    reflection = relationship("Reflection", back_populates="query", uselist=False)
    crp_responses = relationship("CRPResponse", back_populates="query", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Query {self.id} ({self.mode.value})>"
