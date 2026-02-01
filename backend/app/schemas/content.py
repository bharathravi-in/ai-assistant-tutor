"""
TeacherContent Schemas - Request/Response models for content API
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.models.teacher_content import ContentStatus, ContentType


class ContentCreate(BaseModel):
    """Schema for creating new content."""
    title: str = Field(..., min_length=1, max_length=500)
    content_type: ContentType
    description: str = Field(..., min_length=1)
    content_json: Optional[dict] = None
    grade: Optional[int] = Field(None, ge=1, le=12)
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[List[str]] = None
    generate_pdf: bool = Field(default=True, description="Generate and store PDF")
    vectorize: bool = Field(default=True, description="Index in vector DB for search")


class ContentUpdate(BaseModel):
    """Schema for updating content (drafts only)."""
    title: Optional[str] = Field(None, max_length=500)
    content_type: Optional[ContentType] = None
    description: Optional[str] = None
    content_json: Optional[dict] = None
    grade: Optional[int] = Field(None, ge=1, le=12)
    subject: Optional[str] = None
    topic: Optional[str] = None
    tags: Optional[List[str]] = None


class ContentReview(BaseModel):
    """Schema for reviewing content (approve/reject)."""
    approved: bool
    review_notes: Optional[str] = None


class ContentResponse(BaseModel):
    """Schema for content response."""
    id: int
    author_id: int
    author_name: Optional[str] = None
    title: str
    content_type: ContentType
    description: str
    content_json: Optional[dict]
    grade: Optional[int]
    subject: Optional[str]
    topic: Optional[str]
    tags: Optional[List[str]]
    pdf_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    is_vectorized: bool = False
    status: ContentStatus
    reviewer_id: Optional[int]
    reviewer_name: Optional[str] = None
    review_notes: Optional[str]
    reviewed_at: Optional[datetime]
    view_count: int
    like_count: int
    is_liked: bool = False  # Will be computed based on current user
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ContentListResponse(BaseModel):
    """Schema for paginated content list."""
    items: List[ContentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ContentSearchRequest(BaseModel):
    """Schema for semantic search request."""
    query: str = Field(..., min_length=1)
    content_type: Optional[ContentType] = None
    grade: Optional[int] = None
    subject: Optional[str] = None
    limit: int = Field(10, ge=1, le=50)


class ContentSearchResult(BaseModel):
    """Schema for search result item."""
    content: ContentResponse
    score: float
