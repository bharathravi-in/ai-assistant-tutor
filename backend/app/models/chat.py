"""
Chat and Conversation Models - Store conversational AI interactions
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class ChatMode(str, enum.Enum):
    """AI chat mode/purpose."""
    EXPLAIN = "explain"  # Concept explanation
    PLAN = "plan"  # Lesson planning
    ASSIST = "assist"  # Teaching assistance
    ASK = "ask"  # General Q&A
    GENERAL = "general"  # Free conversation


class Conversation(Base):
    """Model for storing conversation sessions."""
    
    __tablename__ = "conversations"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # User & Context
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    mode: Mapped[ChatMode] = mapped_column(Enum(ChatMode), default=ChatMode.GENERAL)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # Auto-generated from first message
    
    # Metadata
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    topic: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    
    # Context Memory - Store teacher preferences/profile
    context_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Teacher profile, preferences, etc.
    
    # Stats
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Conversation {self.id}: {self.title or 'Untitled'}>"


class ChatMessage(Base):
    """Model for storing individual messages in a conversation."""
    
    __tablename__ = "chat_messages"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    
    # Message Details
    role: Mapped[str] = mapped_column(String(20))  # 'user' or 'assistant'
    content: Mapped[str] = mapped_column(Text)
    
    # AI Response Metadata
    ai_model: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., 'gpt-4', 'gemini-pro'
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Structured Data (for explain/plan/tlm modes)
    structured_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Follow-up Suggestions
    suggested_followups: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # Array of suggested questions
    
    # Metadata
    language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    was_voice_input: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    
    def __repr__(self) -> str:
        return f"<ChatMessage {self.id}: {self.role} - {self.content[:30]}>"


class TeacherProfile(Base):
    """Store teacher context/preferences for personalized AI responses."""
    
    __tablename__ = "teacher_profiles"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    
    # Teaching Context
    primary_grades: Mapped[Optional[List[int]]] = mapped_column(JSON, nullable=True)  # [6, 7, 8]
    primary_subjects: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # ["Math", "Science"]
    school_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "government", "private"
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Teaching Style & Preferences
    preferred_language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="en")
    teaching_style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "traditional", "activity-based", etc.
    preferred_ai_tone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # "formal", "casual", "encouraging"
    
    # Common Challenges (for contextual help)
    common_challenges: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    favorite_topics: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Usage Stats
    total_conversations: Mapped[int] = mapped_column(Integer, default=0)
    total_messages: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="profile")
    
    def __repr__(self) -> str:
        return f"<TeacherProfile user_id={self.user_id}>"
