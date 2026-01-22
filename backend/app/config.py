"""
Application Configuration
"""
import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "AI Teaching Assistant"
    debug: bool = False
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/gov_teaching"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/gov_teaching"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT Authentication
    jwt_secret_key: str = "your-super-secret-jwt-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # LLM Configuration - Use os.getenv directly to ensure Docker env vars are read
    @property
    def llm_provider(self) -> str:
        return os.getenv("LLM_PROVIDER", "litellm").lower()
    
    @property
    def openai_api_key(self) -> str:
        return os.getenv("OPENAI_API_KEY", "")
    
    @property
    def google_api_key(self) -> str:
        return os.getenv("GOOGLE_API_KEY", "")
    
    @property
    def anthropic_api_key(self) -> str:
        return os.getenv("ANTHROPIC_API_KEY", "")
    
    @property
    def litellm_api_key(self) -> str:
        return os.getenv("LITELLM_API_KEY", "")
    
    @property
    def litellm_base_url(self) -> str:
        return os.getenv("LITELLM_BASE_URL", "")
    
    @property
    def litellm_model(self) -> str:
        return os.getenv("LITELLM_MODEL", "gpt-4o-mini")
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # Multilingual
    default_language: str = "en"
    supported_languages: str = "en,hi,ta,te,kn,mr"
    
    # Storage Configuration
    document_storage_type: str = "local"  # local, gcp - defaults to local for dev
    gcp_storage_bucket: str = "rfp_proposal"
    gcp_storage_credentials: str = "./service-account-key.json"
    gcp_knowledge_prefix: str = "knowledge"
    gcp_rfp_req_prefix: str = "rfp_requirement"
    gcp_rfp_proposal_prefix: str = "rfp_proposal"
    
    # Email Configuration
    gmail_email: str = ""
    gmail_app_password: str = ""
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def supported_languages_list(self) -> List[str]:
        return [lang.strip() for lang in self.supported_languages.split(",")]
    
    # Use pydantic v2 style model_config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Single cached instance
_settings_instance = None


def get_settings() -> Settings:
    """Get settings instance."""
    global _settings_instance
    
    if _settings_instance is None:
        _settings_instance = Settings()
        # Log on first load
        print(f"[Config] Loaded settings:")
        print(f"  LLM Provider: {_settings_instance.llm_provider}")
        print(f"  LiteLLM API Key: {'***' + _settings_instance.litellm_api_key[-4:] if _settings_instance.litellm_api_key else 'NOT SET'}")
        print(f"  LiteLLM Base URL: {_settings_instance.litellm_base_url or 'NOT SET'}")
        print(f"  LiteLLM Model: {_settings_instance.litellm_model}")
    
    return _settings_instance

