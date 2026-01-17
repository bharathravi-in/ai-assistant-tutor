"""
Survey System Models
For creating and managing surveys across roles
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class SurveyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"


class SurveyTargetRole(str, enum.Enum):
    TEACHER = "teacher"
    CRP = "crp"
    ALL = "all"


class Survey(Base):
    """Survey created by CRP/ARP"""
    __tablename__ = "surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Creator
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = relationship("User", backref="surveys_created")
    
    # Survey details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Questions structure: [{type, question, options?, required}]
    questions = Column(JSON, nullable=False)
    
    # Targeting
    target_role = Column(Enum(SurveyTargetRole), default=SurveyTargetRole.TEACHER)
    target_user_ids = Column(JSON, nullable=True)  # Specific users if not all
    
    # Status
    status = Column(Enum(SurveyStatus), default=SurveyStatus.DRAFT)
    
    # Dates
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    # AI generated?
    is_ai_generated = Column(Boolean, default=False)
    generation_context = Column(Text, nullable=True)  # Context used for AI generation
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SurveyResponse(Base):
    """Response to a survey"""
    __tablename__ = "survey_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to survey
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    survey = relationship("Survey", backref="responses")
    
    # Respondent
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="survey_responses")
    
    # Answers: [{question_index, answer}]
    answers = Column(JSON, nullable=False)
    
    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow)


class SurveyAssignment(Base):
    """Track which users are assigned to which surveys"""
    __tablename__ = "survey_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    survey = relationship("Survey", backref="assignments")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="survey_assignments")
    
    # Status
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    assigned_at = Column(DateTime, default=datetime.utcnow)
