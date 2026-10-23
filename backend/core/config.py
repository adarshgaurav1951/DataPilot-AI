from functools import lru_cache
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "DataPilot AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # LLM Settings
    # Supports: "gemini", "openai", "mock"
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    OPENAI_MODEL: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.1

    # Database
    # Default is SQLite for seamless zero-setup local dev/test; can be set to PostgreSQL in prod
    DATABASE_URL: str = "sqlite:///./data/datapilot.db"

    # Security & Guardrails
    MAX_FILE_SIZE_MB: int = 15
    MAX_ROWS: int = 150_000
    MAX_COLUMNS: int = 250
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60

    # Payment & Billing (Razorpay / Stripe)
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_WEBHOOK_SECRET: str | None = None
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Storage
    UPLOAD_DIR: str = "./data/uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def resolved_llm_provider(self) -> str:
        """Determines active LLM provider based on set API keys if not overridden."""
        configured = (self.LLM_PROVIDER or "").lower().strip()
        if configured == "gemini" and self.GEMINI_API_KEY:
            return "gemini"
        if configured == "openai" and self.OPENAI_API_KEY:
            return "openai"
        if self.GEMINI_API_KEY:
            return "gemini"
        if self.OPENAI_API_KEY:
            return "openai"
        return "mock"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
