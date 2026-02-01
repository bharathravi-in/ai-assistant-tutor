"""
Visit Model - CRP/ARP visits to teachers/schools

This model persists visit scheduling data that was previously stored in-memory.
"""
import enum
from datetime import datetime, date, time
from typing import Optional
from sqlalchemy import String, DateTime, Date, Time, Enum, Text, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class VisitPurpose(str, enum.Enum):
    """Purpose of the visit."""
    ROUTINE = "routine"
    FOLLOW_UP = "follow_up"
    TRAINING = "training"
    OBSERVATION = "observation"
    SUPPORT = "support"
    ASSESSMENT = "assessment"


class VisitStatus(str, enum.Enum):
    """Status of the visit."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class TeacherVisitResponse(str, enum.Enum):
    """Teacher's response to a visit."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    RESCHEDULE_REQUESTED = "reschedule_requested"


class Visit(Base):
    """
    Visit model for CRP/ARP visits to teachers.
    
    Replaces the in-memory _visits_store that was previously used.
    """
    
    __tablename__ = "visits"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Organization (multi-tenant support)
    organization_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    # CRP/ARP who scheduled the visit
    crp_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Teacher being visited
    teacher_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # School being visited (optional, for school-level visits)
    school_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("schools.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Denormalized fields for display (in case teacher/school deleted)
    teacher_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    school_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Visit scheduling
    visit_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    visit_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    visit_time_str: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # Fallback HH:MM string
    
    # Visit details
    purpose: Mapped[VisitPurpose] = mapped_column(
        Enum(VisitPurpose),
        default=VisitPurpose.ROUTINE,
        nullable=False
    )
    status: Mapped[VisitStatus] = mapped_column(
        Enum(VisitStatus),
        default=VisitStatus.SCHEDULED,
        nullable=False,
        index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Teacher acknowledgment/response
    teacher_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    teacher_acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    teacher_response: Mapped[TeacherVisitResponse] = mapped_column(
        Enum(TeacherVisitResponse),
        default=TeacherVisitResponse.PENDING,
        nullable=False
    )
    teacher_response_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    proposed_reschedule_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    proposed_reschedule_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # Post-visit feedback
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    observation_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    crp = relationship("User", foreign_keys=[crp_id], backref="scheduled_visits")
    teacher = relationship("User", foreign_keys=[teacher_id], backref="received_visits")
    organization = relationship("Organization", backref="visits")
    
    def __repr__(self) -> str:
        return f"<Visit {self.id}: {self.teacher_name} on {self.visit_date} ({self.status.value})>"
    
    @property
    def is_upcoming(self) -> bool:
        """Check if visit is in the future."""
        from datetime import date as date_type
        return self.visit_date >= date_type.today() and self.status == VisitStatus.SCHEDULED
    
    @property
    def is_past(self) -> bool:
        """Check if visit is in the past or completed."""
        from datetime import date as date_type
        return self.visit_date < date_type.today() or self.status in [VisitStatus.COMPLETED, VisitStatus.CANCELLED]
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "crp_id": self.crp_id,
            "teacher_id": self.teacher_id,
            "teacher": self.teacher_name,
            "school": self.school_name,
            "date": self.visit_date.isoformat() if self.visit_date else None,
            "time": self.visit_time_str or (self.visit_time.strftime("%H:%M") if self.visit_time else None),
            "purpose": self.purpose.value if self.purpose else None,
            "status": self.status.value if self.status else None,
            "notes": self.notes,
            "teacher_acknowledged": self.teacher_acknowledged,
            "teacher_response": self.teacher_response.value if self.teacher_response else None,
            "teacher_response_notes": self.teacher_response_notes,
            "proposed_reschedule_date": self.proposed_reschedule_date.isoformat() if self.proposed_reschedule_date else None,
            "proposed_reschedule_time": self.proposed_reschedule_time,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "completed_notes": self.completed_notes,
            "observation_summary": self.observation_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
