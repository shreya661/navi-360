from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    allowed_origins: str = "http://localhost:5173"
    app_env: str = "development"
    expose_docs: bool = True
    require_live_ai: bool = False
    max_upload_mb: int = 8
    max_total_upload_mb: int = 16
    max_evidence_files: int = 6
    max_text_chars: int = 20_000
    analysis_db_path: str = "data/navi360.db"
    analysis_retention_days: int = 30
    rate_limit_per_minute: int = 20
    nvidia_api_key: str | None = None
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    vision_model: str = "qwen/qwen3.5-122b-a10b"
    text_model: str = "deepseek-ai/deepseek-v4-pro"
    text_fast_model: str = "deepseek-ai/deepseek-v4-flash"
    bhashini_tts_url: str | None = None
    bhashini_api_key: str | None = None
    bhashini_user_id: str | None = None

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
