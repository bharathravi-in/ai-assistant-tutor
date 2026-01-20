"""
Query Schemas
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, computed_field
from app.models.query import QueryMode


class QueryCreate(BaseModel):
    """Schema for creating a new query."""
    mode: QueryMode
    input_text: str = Field(..., min_length=1)
    input_language: str = "en"
    grade: Optional[int] = Field(None, ge=1, le=12)
    subject: Optional[str] = None
    topic: Optional[str] = None


class QueryResponse(BaseModel):
    """Schema for query response."""
    id: int
    user_id: int
    mode: QueryMode
    input_text: str
    input_language: str
    grade: Optional[int]
    subject: Optional[str]
    topic: Optional[str]
    ai_response: Optional[str]
    response_language: str
    processing_time_ms: Optional[int]
    is_resolved: bool
    requires_crp_review: bool
    created_at: datetime
    responded_at: Optional[datetime]
    response_metadata: Optional[dict] = None
    
    # Computed field to extract structured from response_metadata for API serialization
    @computed_field
    @property
    def structured(self) -> Optional[Any]:
        if self.response_metadata and isinstance(self.response_metadata, dict):
            return self.response_metadata.get("structured")
        return None
    
    class Config:
        from_attributes = True




class QueryListResponse(BaseModel):
    """Schema for paginated query list."""
    items: List[QueryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
