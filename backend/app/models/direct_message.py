"""
Direct Message Model - For Teacher-CRP direct communication
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class DirectMessage(Base):
    """Direct messages between Teachers and CRPs."""
    
    __tablename__ = "direct_messages"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Sender and receiver
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Message content
    content: Mapped[str] = mapped_column(Text)
    
    # Optional: related to a specific query
    query_id: Mapped[Optional[int]] = mapped_column(ForeignKey("queries.id"), nullable=True)
    
    # Read status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")
    query = relationship("Query", backref="direct_messages")
    
    def __repr__(self) -> str:
        return f"<DirectMessage {self.id} from={self.sender_id} to={self.receiver_id}>"
