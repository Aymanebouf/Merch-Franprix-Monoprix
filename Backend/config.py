from __future__ import annotations
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "SupplierScore"
    API_PREFIX: str = ""  # si tu veux un prefix type '/api', change ici
    SQLITE_PATH: str = "data/app.db"

    # JWT
    SECRET_KEY: str = "change-me-in-.env"
    ACCESS_TOKEN_EXPIRE: int = 60 * 24  # minutes

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
