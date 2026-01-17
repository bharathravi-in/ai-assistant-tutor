"""
Program/Library Models
For organizing resources into structured programs
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class ProgramStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Program(Base):
    """A collection of resources organized as a program/course"""
    __tablename__ = "programs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Creator (ARP typically)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = relationship("User", backref="programs_created")
    
    # Program details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Categorization
    grade = Column(Integer, nullable=True)
    subject = Column(String(100), nullable=True)
    
    # Cover image
    cover_image_url = Column(String(500), nullable=True)
    
    # Status
    status = Column(Enum(ProgramStatus), default=ProgramStatus.DRAFT)
    
    # Visibility
    is_public = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)


class ProgramResource(Base):
    """Link between program and resources with ordering"""
    __tablename__ = "program_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Links
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    program = relationship("Program", backref="program_resources")
    
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    resource = relationship("Resource", backref="program_links")
    
    # Ordering
    order = Column(Integer, default=0)
    
    # Optional section/module grouping
    section_name = Column(String(255), nullable=True)
    section_order = Column(Integer, default=0)
    
    # Timestamps
    added_at = Column(DateTime, default=datetime.utcnow)


class ResourcePublishRequest(Base):
    """Track resource publishing workflow"""
    __tablename__ = "resource_publish_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Resource being published
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    resource = relationship("Resource", backref="publish_requests")
    
    # Requester (teacher typically)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_by = relationship("User", foreign_keys=[requested_by_id], backref="publish_requests_made")
    
    # Reviewer (CRP/ARP)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id], backref="publish_requests_reviewed")
    
    # Status
    status = Column(String(50), default="pending")  # pending, approved, rejected
    review_notes = Column(Text, nullable=True)
    
    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
