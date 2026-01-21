"""
Configuration Management

Centralized configuration using Pydantic Settings with environment variable support.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Environment
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api"
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # Firebase
    firebase_project_id: str = ""
    firebase_credentials_path: str | None = None
    firebase_emulator_host: str | None = None

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_prefix: str = "lensio:"

    # OpenAI
    openai_api_key: SecretStr = SecretStr("")
    openai_model: str = "gpt-4o"
    openai_max_retries: int = 3

    # Anthropic
    anthropic_api_key: SecretStr = SecretStr("")
    anthropic_model: str = "claude-3-5-sonnet-20241022"

    # Google AI Studio (Primary AI Provider)
    google_ai_api_key: SecretStr = SecretStr("")
    google_project_id: str = ""
    
    # Google AI Models
    gemini_model: str = "gemini-2.5-flash-preview-05-20"
    imagen_model: str = "imagen-3.0-generate-002"
    veo_model: str = "veo-2.0-generate-001"
    gemini_tts_model: str = "gemini-2.5-flash-preview-tts"

    # Image Generation (Replicate/FAL - Fallback)
    replicate_api_key: SecretStr = SecretStr("")
    fal_api_key: SecretStr = SecretStr("")

    # Video Generation (Runway - Fallback)
    runway_api_key: SecretStr = SecretStr("")

    # Audio (ElevenLabs - Fallback)
    elevenlabs_api_key: SecretStr = SecretStr("")

    # Google Drive
    google_client_id: str = ""
    google_client_secret: SecretStr = SecretStr("")
    google_redirect_uri: str = ""

    # Stripe
    stripe_api_key: SecretStr = SecretStr("")
    stripe_webhook_secret: SecretStr = SecretStr("")

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_default_rpm: int = 60

    # Cost Control
    daily_budget_usd: float = 1000.0
    max_job_cost_usd: float = 5.0

    # Logging
    log_level: str = "INFO"
    log_json: bool = True

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Convenience alias
settings = get_settings()
