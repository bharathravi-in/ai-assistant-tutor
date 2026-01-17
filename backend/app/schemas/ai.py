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
    media_path: Optional[str] = None # Path to uploaded media
    
    # Theme 1: Classroom Context
    is_multigrade: Optional[bool] = False
    class_size: Optional[int] = None
    instructional_time_minutes: Optional[int] = None
    
    # Share with CRP for review
    share_with_crp: Optional[bool] = False



class QuizRequest(BaseModel):
    """Schema for Quiz generation request."""
    topic: str
    content: str
    language: str = "en"
    level: str = "medium"


class QuizQuestion(BaseModel):
    """Schema for a single quiz question."""
    id: int
    type: str # mcq, fill_in_the_blank, true_false
    question: str
    options: Optional[List[str]] = None
    answer: str
    explanation: Optional[str] = None


class QuizResponse(BaseModel):
    """Schema for the full quiz."""
    title: str
    description: str
    questions: List[QuizQuestion]


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


class TLMRequest(BaseModel):
    """Schema for TLM generation request."""
    topic: str
    content: str
    language: str = "en"


class Flashcard(BaseModel):
    """Schema for a single flashcard."""
    front: str
    back: str


class DIYWorkshop(BaseModel):
    """Schema for physical DIY aid instructions."""
    title: str
    materials: List[str]
    steps: List[str]
    usage_tips: str


class PosterTemplate(BaseModel):
    """Schema for a poster layout."""
    title: str
    key_sections: List[str]
    visual_layout_description: str


class VisualKit(BaseModel):
    """Schema for the visual aid collection."""
    flashcards: List[Flashcard]
    poster_template: PosterTemplate


class TLMResponse(BaseModel):
    """Full response for TLM Designer."""
    diy_workshop: DIYWorkshop
    visual_kit: VisualKit


class AuditRequest(BaseModel):
    """Schema for content audit request."""
    topic: str
    content: str
    grade: Optional[int] = None
    subject: Optional[str] = None


class AuditResponse(BaseModel):
    """Schema for individual audit results."""
    is_compliant: bool
    compliance_score: int
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]
    ncert_ref: Optional[str] = None
