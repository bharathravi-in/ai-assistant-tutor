"""
Application Configuration
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings


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
    
    # LLM Configuration
    llm_provider: str = "openai"  # openai, gemini, litellm
    openai_api_key: str = ""
    google_api_key: str = ""
    
    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    # Multilingual
    default_language: str = "en"
    supported_languages: str = "en,hi,ta,te,kn,mr"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def supported_languages_list(self) -> List[str]:
        return [lang.strip() for lang in self.supported_languages.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
