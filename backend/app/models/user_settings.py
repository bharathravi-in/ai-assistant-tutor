"""
User Settings Model - Stores voice preferences and custom voices
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Float, Boolean, Text, JSON, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class UserSettings(Base):
    """User settings model for voice preferences and custom voices."""
    
    __tablename__ = "user_settings"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # User reference
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True
    )
    
    # Voice Settings
    selected_voice: Mapped[str] = mapped_column(String(50), default="voice-1")
    voice_rate: Mapped[float] = mapped_column(Float, default=1.0)
    voice_pitch: Mapped[float] = mapped_column(Float, default=1.0)
    auto_play_response: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Custom Voices (stored as JSON array)
    custom_voices: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=list)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", backref="settings")
    
    def __repr__(self) -> str:
        return f"<UserSettings user_id={self.user_id}>"


class CustomVoice(Base):
    """Custom voice model for storing user-uploaded voice samples."""
    
    __tablename__ = "custom_voices"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # User reference
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )
    
    # Voice info
    name: Mapped[str] = mapped_column(String(100))
    gender: Mapped[str] = mapped_column(String(10), default="male")  # male or female
    audio_filename: Mapped[str] = mapped_column(String(255))  # Stored file name
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Public URL
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", backref="custom_voices")
    
    def __repr__(self) -> str:
        return f"<CustomVoice {self.name} user_id={self.user_id}>"
    
    def to_dict(self) -> dict:
        return {
            "id": f"custom-{self.id}",
            "name": self.name,
            "gender": self.gender,
            "audioUrl": self.audio_url,
            "createdAt": self.created_at.isoformat()
        }
