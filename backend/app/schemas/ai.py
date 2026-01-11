"""
AI Request/Response Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.query import QueryMode


class AIRequest(BaseModel):
    """Schema for AI request."""
    mode: QueryMode
    input_text: str = Field(..., min_length=1)
    language: str = "en"
    grade: Optional[int] = Field(None, ge=1, le=12)
    subject: Optional[str] = None
    topic: Optional[str] = None
    context: Optional[str] = None  # Additional context


class ExplainResponse(BaseModel):
    """Response for Explain/Teach mode."""
    simple_explanation: str
    what_to_say: str
    example_or_analogy: str
    check_for_understanding: str


class AssistResponse(BaseModel):
    """Response for Classroom Assist mode."""
    immediate_action: str
    management_strategy: str
    teaching_pivot: str
    fallback_option: str


class LessonActivity(BaseModel):
    """Individual activity in a lesson plan."""
    duration_minutes: int
    activity_name: str
    description: str
    materials_needed: Optional[List[str]] = None


class PlanResponse(BaseModel):
    """Response for Lesson Plan mode."""
    learning_objectives: List[str]
    duration_minutes: int
    activities: List[LessonActivity]
    multi_grade_adaptations: Optional[str] = None
    low_tlm_alternatives: Optional[str] = None
    exit_questions: List[str]


class AIResponse(BaseModel):
    """Generic AI response wrapper."""
    mode: QueryMode
    language: str
    content: ExplainResponse | AssistResponse | PlanResponse
    processing_time_ms: int
    suggestions: Optional[List[str]] = None  # Follow-up suggestions
