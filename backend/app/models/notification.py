"""
Notification Model - Push notifications and in-app alerts
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
import enum

from app.database import Base


class NotificationType(str, enum.Enum):
    """Notification type enum."""
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CONTENT_APPROVED = "CONTENT_APPROVED"
    CONTENT_REJECTED = "CONTENT_REJECTED"
    QUERY_RESPONSE = "QUERY_RESPONSE"
    REFLECTION_REMINDER = "REFLECTION_REMINDER"
    NEW_RESOURCE = "NEW_RESOURCE"
    SYSTEM_UPDATE = "SYSTEM_UPDATE"
    CRP_VISIT = "CRP_VISIT"
    SURVEY_ASSIGNED = "SURVEY_ASSIGNED"
    MESSAGE = "MESSAGE"
    MENTOR_FEEDBACK = "MENTOR_FEEDBACK"  # CRP/ARP feedback on teacher queries


class Notification(Base):
    """Model for storing user notifications."""
    
    __tablename__ = "notifications"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Target user
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Notification details
    type: Mapped[NotificationType] = mapped_column(SQLEnum(NotificationType), default=NotificationType.INFO)
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    
    # Optional action link
    action_url: Mapped[str] = mapped_column(String(500), nullable=True)
    action_label: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Related entity references (optional)
    related_entity_type: Mapped[str] = mapped_column(String(50), nullable=True)  # 'query', 'content', 'survey', etc.
    related_entity_id: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # Additional data
    extra_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    
    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="notifications")
    
    def __repr__(self) -> str:
        return f"<Notification {self.id}: {self.type.value} for user {self.user_id}>"
