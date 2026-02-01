"""
Micro-Learning Module - Prebuilt coaching content for teachers
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
import enum

from app.database import Base


class LearningModuleCategory(str, enum.Enum):
    """Module category enum."""
    PEDAGOGY = "pedagogy"
    CLASSROOM_MANAGEMENT = "classroom_management"
    SUBJECT_SPECIFIC = "subject_specific"
    TECHNOLOGY_INTEGRATION = "technology_integration"
    ASSESSMENT = "assessment"
    STUDENT_ENGAGEMENT = "student_engagement"
    DIFFERENTIATION = "differentiation"
    COMMUNICATION = "communication"


class LearningModuleDifficulty(str, enum.Enum):
    """Module difficulty level."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class LearningModule(Base):
    """Prebuilt micro-learning coaching modules for teachers."""
    
    __tablename__ = "learning_modules"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Module metadata
    title: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[LearningModuleCategory] = mapped_column(SQLEnum(LearningModuleCategory), index=True)
    difficulty: Mapped[LearningModuleDifficulty] = mapped_column(SQLEnum(LearningModuleDifficulty))
    
    # Content
    content: Mapped[dict] = mapped_column(JSON)  # Rich structured content
    duration_minutes: Mapped[int] = mapped_column(Integer)  # Estimated completion time
    
    # Tags & search
    tags: Mapped[list] = mapped_column(JSON, nullable=True)  # ["active learning", "engagement"]
    keywords: Mapped[str] = mapped_column(Text, nullable=True)  # For search
    
    # Prerequisites & related
    prerequisites: Mapped[list] = mapped_column(JSON, nullable=True)  # Module IDs
    related_modules: Mapped[list] = mapped_column(JSON, nullable=True)  # Module IDs
    
    # Target audience
    grades: Mapped[list] = mapped_column(JSON, nullable=True)  # [6, 7, 8]
    subjects: Mapped[list] = mapped_column(JSON, nullable=True)  # ["Math", "Science"]
    
    # Resources
    resources: Mapped[list] = mapped_column(JSON, nullable=True)  # Links to PDFs, videos, etc.
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Stats
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    completion_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_avg: Mapped[float] = mapped_column(default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress_records = relationship("ModuleProgress", back_populates="module", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<LearningModule {self.id}: {self.title}>"


class ModuleProgress(Base):
    """Track teacher progress through learning modules."""
    
    __tablename__ = "module_progress"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # References
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("learning_modules.id"), index=True)
    
    # Progress
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completion_percentage: Mapped[int] = mapped_column(Integer, default=0)
    time_spent_minutes: Mapped[int] = mapped_column(Integer, default=0)
    
    # Rating & feedback
    rating: Mapped[int] = mapped_column(Integer, nullable=True)  # 1-5 stars
    feedback: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Bookmarked
    is_bookmarked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    last_accessed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="module_progress")
    module = relationship("LearningModule", back_populates="progress_records")
    
    def __repr__(self) -> str:
        return f"<ModuleProgress user={self.user_id} module={self.module_id}>"


class ScenarioTemplate(Base):
    """Common classroom scenario templates with AI-powered solutions."""
    
    __tablename__ = "scenario_templates"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Scenario metadata
    title: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100), index=True)  # "Behavior", "Engagement", etc.
    
    # Scenario details
    situation: Mapped[str] = mapped_column(Text)  # The challenge/problem
    context: Mapped[dict] = mapped_column(JSON, nullable=True)  # Additional context
    
    # Solution framework
    solution_framework: Mapped[dict] = mapped_column(JSON)  # Structured solution approach
    expert_tips: Mapped[list] = mapped_column(JSON, nullable=True)  # List of expert tips
    common_mistakes: Mapped[list] = mapped_column(JSON, nullable=True)  # Things to avoid
    
    # Related resources
    related_modules: Mapped[list] = mapped_column(JSON, nullable=True)  # Learning module IDs
    related_resources: Mapped[list] = mapped_column(JSON, nullable=True)  # Resource links
    
    # Tags & search
    tags: Mapped[list] = mapped_column(JSON, nullable=True)
    keywords: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Target audience
    grades: Mapped[list] = mapped_column(JSON, nullable=True)
    subjects: Mapped[list] = mapped_column(JSON, nullable=True)
    
    # Visibility
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Stats
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)  # How many times applied
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)  # Marked as helpful
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<ScenarioTemplate {self.id}: {self.title}>"
