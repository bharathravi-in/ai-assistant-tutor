"""
Organization Settings Model - Encrypted configuration storage
"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Enum, Text, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AIProvider(str, enum.Enum):
    """Supported AI/LLM providers."""
    OPENAI = "openai"
    GEMINI = "gemini"
    AZURE_OPENAI = "azure_openai"
    ANTHROPIC = "anthropic"
    LITELLM = "litellm"


class StorageProvider(str, enum.Enum):
    """Supported cloud storage providers."""
    LOCAL = "local"
    GCS = "gcs"  # Google Cloud Storage
    S3 = "s3"    # AWS S3
    AZURE_BLOB = "azure_blob"


class OrganizationSettings(Base):
    """
    Organization-specific settings and configuration.
    Sensitive values (API keys) are stored encrypted.
    """
    
    __tablename__ = "organization_settings"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("organizations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    
    # AI Provider Configuration
    ai_provider: Mapped[AIProvider] = mapped_column(
        Enum(AIProvider), 
        default=AIProvider.OPENAI
    )
    openai_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    openai_model: Mapped[str] = mapped_column(String(50), default="gpt-4o-mini")
    
    gemini_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    gemini_model: Mapped[str] = mapped_column(String(50), default="gemini-1.5-flash")
    
    azure_openai_endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    azure_openai_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    azure_openai_deployment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    anthropic_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    
    # LiteLLM Configuration
    litellm_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    litellm_base_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    litellm_model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini")
    
    # Storage Configuration
    storage_provider: Mapped[StorageProvider] = mapped_column(
        Enum(StorageProvider), 
        default=StorageProvider.LOCAL
    )
    
    # Google Cloud Storage
    gcs_bucket_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    gcs_service_account_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted JSON
    
    # AWS S3
    s3_bucket_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    s3_region: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    s3_access_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    s3_secret_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    
    # Azure Blob Storage
    azure_storage_connection_string: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    azure_storage_container: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Feature Flags
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    multilingual_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_branding_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    advanced_analytics_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    api_access_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Third-party Integrations
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    webhook_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    webhook_events: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Events to trigger
    
    # SSO Configuration
    sso_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    sso_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # google, azure_ad, okta
    sso_client_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sso_client_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    sso_domain: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # LMS Integration
    lms_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    lms_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # canvas, moodle, blackboard
    lms_api_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    lms_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    
    # Rate Limits (override plan defaults)
    custom_rate_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # requests per minute
    custom_ai_quota: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # AI calls per month
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="settings")
    
    def __repr__(self) -> str:
        return f"<OrganizationSettings org_id={self.organization_id}>"
