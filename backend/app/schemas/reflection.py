"""
Reflection and CRP Response Schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.reflection import ResponseTag


class ReflectionCreate(BaseModel):
    """Schema for creating a reflection."""
    query_id: int
    tried: bool
    worked: Optional[bool] = None
    text_feedback: Optional[str] = None
    voice_note_url: Optional[str] = None
    voice_note_transcript: Optional[str] = None


class ReflectionResponse(BaseModel):
    """Schema for reflection response."""
    id: int
    query_id: int
    tried: bool
    worked: Optional[bool]
    voice_note_url: Optional[str]
    voice_note_transcript: Optional[str]
    text_feedback: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class CRPResponseCreate(BaseModel):
    """Schema for creating a CRP response."""
    query_id: int
    response_text: Optional[str] = None
    voice_note_url: Optional[str] = None
    voice_note_duration_sec: Optional[int] = None
    tag: Optional[ResponseTag] = None
    overrides_ai: bool = False
    override_reason: Optional[str] = None
    observation_notes: Optional[str] = None
    voice_note_transcript: Optional[str] = None



class CRPResponseResponse(BaseModel):
    """Schema for CRP response."""
    id: int
    query_id: int
    crp_id: int
    response_text: Optional[str]
    voice_note_url: Optional[str]
    tag: Optional[ResponseTag]
    overrides_ai: bool
    observation_notes: Optional[str] = None
    voice_note_transcript: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
