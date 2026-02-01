"""
Pydantic schemas for Chat/Conversation endpoints
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.chat import ChatMode


# ===== Request Schemas =====

class ChatMessageInput(BaseModel):
    """Input for sending a message in a conversation."""
    content: str = Field(..., min_length=1, max_length=5000, description="Message content")
    language: Optional[str] = Field("en", description="Language code")
    voice_note_url: Optional[str] = Field(None, description="Voice note file URL if voice input")


class ConversationCreateInput(BaseModel):
    """Input for creating a new conversation."""
    mode: ChatMode = Field(ChatMode.GENERAL, description="Chat mode/purpose")
    title: Optional[str] = Field(None, max_length=200, description="Conversation title")
    grade: Optional[int] = Field(None, ge=1, le=12, description="Grade level")
    subject: Optional[str] = Field(None, max_length=100, description="Subject")
    topic: Optional[str] = Field(None, max_length=300, description="Topic")
    initial_message: Optional[str] = Field(None, description="First message to start conversation")


class ConversationUpdateInput(BaseModel):
    """Update conversation metadata."""
    title: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = Field(None, description="Mark conversation as inactive/archived")


class TeacherProfileInput(BaseModel):
    """Input for creating/updating teacher profile."""
    primary_grades: Optional[List[int]] = Field(None, description="Grades taught")
    primary_subjects: Optional[List[str]] = Field(None, description="Subjects taught")
    school_type: Optional[str] = Field(None, description="School type")
    location: Optional[str] = Field(None, max_length=200)
    preferred_language: Optional[str] = Field("en", description="Preferred language")
    teaching_style: Optional[str] = Field(None, description="Teaching style preference")
    preferred_ai_tone: Optional[str] = Field("encouraging", description="AI response tone")
    common_challenges: Optional[List[str]] = Field(None, description="Common teaching challenges")
    favorite_topics: Optional[List[str]] = Field(None, description="Favorite topics")


# ===== Response Schemas =====

class ChatMessageResponse(BaseModel):
    """Response schema for a single chat message."""
    id: int
    conversation_id: int
    role: str  # 'user' or 'assistant'
    content: str
    structured_data: Optional[dict] = None
    suggested_followups: Optional[List[str]] = None
    ai_model: Optional[str] = None
    tokens_used: Optional[int] = None
    response_time_ms: Optional[int] = None
    language: Optional[str] = None
    was_voice_input: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Response schema for a conversation (without messages)."""
    id: int
    user_id: int
    mode: ChatMode
    title: Optional[str] = None
    grade: Optional[int] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    message_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    """Response schema for conversation with messages."""
    id: int
    user_id: int
    mode: ChatMode
    title: Optional[str] = None
    grade: Optional[int] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    context_data: Optional[dict] = None
    message_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """Response for listing conversations with pagination."""
    conversations: List[ConversationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TeacherProfileResponse(BaseModel):
    """Response schema for teacher profile."""
    id: int
    user_id: int
    primary_grades: Optional[List[int]] = None
    primary_subjects: Optional[List[str]] = None
    school_type: Optional[str] = None
    location: Optional[str] = None
    preferred_language: Optional[str] = "en"
    teaching_style: Optional[str] = None
    preferred_ai_tone: Optional[str] = "encouraging"
    common_challenges: Optional[List[str]] = None
    favorite_topics: Optional[List[str]] = None
    total_conversations: int = 0
    total_messages: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSendResponse(BaseModel):
    """Response after sending a message (includes AI response)."""
    user_message: ChatMessageResponse
    ai_response: ChatMessageResponse
    conversation: ConversationResponse
