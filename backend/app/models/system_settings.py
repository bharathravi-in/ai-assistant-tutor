"""
System Settings Model - Platform-wide configuration
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SystemSettings(Base):
    """
    Global system settings and configuration.
    Sensitive values are stored encrypted.
    """
    
    __tablename__ = "system_settings"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # AI Provider Configuration
    ai_provider: Mapped[str] = mapped_column(String(50), default="openai")
    openai_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    openai_model: Mapped[str] = mapped_column(String(50), default="gpt-4o-mini")
    
    gemini_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    gemini_model: Mapped[str] = mapped_column(String(50), default="gemini-pro")
    
    anthropic_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    
    azure_openai_endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    azure_openai_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    azure_openai_deployment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # LiteLLM Configuration
    litellm_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Encrypted
    litellm_base_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    litellm_model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini")
    
    # Timestamps
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<SystemSettings id={self.id} provider={self.ai_provider}>"
