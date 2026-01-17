"""
Feedback System Models
For feedback requests and responses between roles
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class FeedbackStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    EXPIRED = "expired"


class FeedbackRequest(Base):
    """Feedback request from CRP/ARP to Teacher/CRP"""
    __tablename__ = "feedback_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who is requesting feedback
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester = relationship("User", foreign_keys=[requester_id], backref="feedback_requests_sent")
    
    # Who should provide feedback
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user = relationship("User", foreign_keys=[target_user_id], backref="feedback_requests_received")
    
    # Request details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    questions = Column(JSON, nullable=False)  # List of question objects
    
    # Status tracking
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.PENDING)
    due_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FeedbackResponse(Base):
    """Response to a feedback request"""
    __tablename__ = "feedback_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to request
    request_id = Column(Integer, ForeignKey("feedback_requests.id"), nullable=False)
    request = relationship("FeedbackRequest", backref="responses")
    
    # Who responded
    responder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    responder = relationship("User", backref="feedback_responses")
    
    # Response data
    answers = Column(JSON, nullable=False)  # List of answer objects matching questions
    additional_notes = Column(Text, nullable=True)
    
    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow)


class QueryShare(Base):
    """Track queries shared with mentors for review"""
    __tablename__ = "query_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to original query
    query_id = Column(Integer, ForeignKey("queries.id"), nullable=False)
    query = relationship("Query", backref="shares")
    
    # Who it's shared with
    shared_with_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shared_with = relationship("User", backref="shared_queries")
    
    # Mentor response
    mentor_notes = Column(Text, nullable=True)
    is_reviewed = Column(Boolean, default=False)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
