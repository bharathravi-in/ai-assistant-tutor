"""
Reflection and CRP Response Models
"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Enum, Text, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ResponseTag(str, enum.Enum):
    """Tags for CRP responses."""
    EFFECTIVE = "effective"
    NEEDS_FOLLOWUP = "needs_followup"
    BEST_PRACTICE = "best_practice"
    REQUIRES_TRAINING = "requires_training"


class Reflection(Base):
    """Reflection model for teacher feedback on AI suggestions."""
    
    __tablename__ = "reflections"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    query_id: Mapped[int] = mapped_column(ForeignKey("queries.id"), unique=True, index=True)
    
    # Feedback
    tried: Mapped[bool] = mapped_column(Boolean, default=False)  # Did teacher try the suggestion?
    worked: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)  # Did it work?
    
    # Voice Reflection
    voice_note_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    voice_note_duration_sec: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    voice_note_transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Analysis
    pedagogical_sentiment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # positive, frustrated, etc.
    analysis_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Internal AI analysis
    
    # Text Reflection
    text_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    query = relationship("Query", back_populates="reflection")
    
    def __repr__(self) -> str:
        return f"<Reflection {self.id} tried={self.tried} worked={self.worked}>"


class CRPResponse(Base):
    """CRP/ARP response to teacher queries."""
    
    __tablename__ = "crp_responses"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    query_id: Mapped[int] = mapped_column(ForeignKey("queries.id"), index=True)
    crp_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Response Content
    response_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    voice_note_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    voice_note_duration_sec: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    observation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    voice_note_transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Tagging
    tag: Mapped[Optional[ResponseTag]] = mapped_column(Enum(ResponseTag), nullable=True)
    
    # AI Override
    overrides_ai: Mapped[bool] = mapped_column(Boolean, default=False)
    override_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Best Practice flag
    is_best_practice: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    
    # Relationships
    query = relationship("Query", back_populates="crp_responses")
    crp = relationship("User", foreign_keys=[crp_id])
    
    def __repr__(self) -> str:
        return f"<CRPResponse {self.id} by CRP {self.crp_id}>"
