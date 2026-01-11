"""
Organization Model - Multi-tenant support
"""
import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, Enum, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SubscriptionPlan(str, enum.Enum):
    """Subscription tiers for organizations."""
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class Organization(Base):
    """
    Organization model representing a tenant in the multi-tenant SaaS.
    Each organization has its own users, settings, and data isolation.
    """
    
    __tablename__ = "organizations"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    # Branding
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # Hex color
    custom_domain: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Contact Information
    contact_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Subscription
    subscription_plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan), 
        default=SubscriptionPlan.FREE
    )
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="organization", lazy="dynamic")
    settings = relationship("OrganizationSettings", back_populates="organization", uselist=False)
    
    def __repr__(self) -> str:
        return f"<Organization {self.name} ({self.slug})>"
    
    @property
    def is_subscription_active(self) -> bool:
        """Check if subscription is currently active."""
        if self.subscription_plan == SubscriptionPlan.FREE:
            return True
        if self.subscription_expires_at is None:
            return False
        return self.subscription_expires_at > datetime.utcnow()
