try:
    # Pydantic v2
    from pydantic_settings import BaseSettings
except Exception:  # pragma: no cover
    # Pydantic v1 fallback
    from pydantic import BaseSettings


class Settings(BaseSettings):
    FRA_THRESHOLD: float = 1.0

    class Config:
        env_file = ".env"


settings = Settings()

