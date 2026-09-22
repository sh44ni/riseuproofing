from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            ".env",
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env.production"),
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    APP_ENV: str = "development"
    APP_NAME: str = "Rise Up Roofing API & Developer Platform"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://riseuprac.com",
        "https://riseuproofing.vercel.app",
        "https://riseup-roofing.vercel.app",
    ]

    # Database — must be set in .env, no hardcoded fallback
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5434/riseup_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_PRE_PING: bool = True

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Authentication & Admin
    ADMIN_PASSWORD: str = "RiseUp2024!"
    SESSION_SECRET_KEY: str = "riseup-super-secret-key-change-in-production-64-chars-long!"
    COOKIE_NAME: str = "admin_session"
    SESSION_HOURS: int = 24
    MIGRATION_KEY: str = "riseup_migrate_secret_2025"

    # Developer Portal & Dynamic API Keys
    DEVELOPER_SEEDPHRASE: str = "sheWASg0n3forgood"
    DEVELOPER_SEEDPHRASE_HASH: str = "68e59684d862b174db3799518e3675777c7ad58467ab222883843f2c9287693d"
    DEVELOPER_COOKIE_NAME: str = "dev_session"
    DEVELOPER_SESSION_HOURS: int = 12
    API_KEY_PREFIX_LIVE: str = "rup_live_"
    API_KEY_PREFIX_TEST: str = "rup_test_"

    # S3 Storage (MinIO / R2 / AWS S3)
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_MEDIA: str = "riseup-media"
    S3_BUCKET_DOCS: str = "riseup-documents"
    S3_REGION: str = "us-east-1"
    S3_PUBLIC_URL_BASE: str = "http://localhost:9000/riseup-media"

    # Integrations
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_BUSINESS_PROFILE_ID: str = "17709679383662028228"
    CRON_SECRET: str = "riseup_cron_sec_88f92a10e"

    YELP_CLIENT_ID: str = ""
    YELP_API_KEY: str = ""
    YELP_BUSINESS_ID: str = "a5D1p0D5siZYO43g16Excg"
    YELP_BUSINESS_ALIAS: str = "rise-up-roofing-and-construction-oceanside-2"

    WEATHER_API_KEY: str = "ec61cfb5c3ab44b6b3c184755261209"

    # Resend Transactional Email Service
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Rise Up Roofing <estimates@riseuprac.com>"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]


settings = Settings()
