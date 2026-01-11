"""
Subscription and Usage Models
"""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Integer, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.organization import SubscriptionPlan


class PlanLimits(Base):
    """
    Define limits and features for each subscription plan.
    Superadmin can configure these.
    """
    
    __tablename__ = "plan_limits"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    plan: Mapped[SubscriptionPlan] = mapped_column(String(50), unique=True, nullable=False)
    
    # User Limits
    max_users: Mapped[int] = mapped_column(Integer, default=5)
    max_admins: Mapped[int] = mapped_column(Integer, default=1)
    
    # Usage Limits (per month)
    max_queries_per_month: Mapped[int] = mapped_column(Integer, default=100)
    max_ai_minutes_per_month: Mapped[int] = mapped_column(Integer, default=60)
    max_storage_mb: Mapped[int] = mapped_column(Integer, default=100)
    
    # Feature Flags
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    multilingual_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_branding: Mapped[bool] = mapped_column(Boolean, default=False)
    advanced_analytics: Mapped[bool] = mapped_column(Boolean, default=False)
    api_access: Mapped[bool] = mapped_column(Boolean, default=False)
    priority_support: Mapped[bool] = mapped_column(Boolean, default=False)
    sso_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    custom_domain: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Additional Features (JSON for flexibility)
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Pricing (for display purposes)
    price_monthly_usd: Mapped[float] = mapped_column(Float, default=0.0)
    price_yearly_usd: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<PlanLimits {self.plan}>"


class UsageTracking(Base):
    """
    Track usage per organization per billing period.
    """
    
    __tablename__ = "usage_tracking"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Billing Period
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Usage Metrics
    queries_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_minutes_used: Mapped[float] = mapped_column(Float, default=0.0)
    storage_used_mb: Mapped[float] = mapped_column(Float, default=0.0)
    users_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # API Usage
    api_calls_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Detailed breakdown (optional)
    usage_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<UsageTracking org={self.organization_id} period={self.period_start}>"


class AuditLog(Base):
    """
    Audit trail for sensitive operations.
    """
    
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Who
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    organization_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # What
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "settings.update", "user.create"
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "organization", "user"
    resource_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Details
    old_values: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    new_values: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self) -> str:
        return f"<AuditLog {self.action} by user={self.user_id}>"
