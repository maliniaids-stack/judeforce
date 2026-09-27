from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    DATABASE_URL: str = "sqlite:///./prism_ai.db"

    # Redis (Celery broker + result backend)
    REDIS_URL: str = "redis://localhost:6379/0"

    # MinIO (S3-compatible file storage)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "prism-ai-uploads"
    MINIO_SECURE: bool = False

    # Vector DB (Qdrant)
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333

    # Embeddings
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # LLM + LoRA generation (Set to "fast" for instant ~1s demo, or "local" for GPU PyTorch Qwen-7B)
    LLM_MODE: str = "fast"
    LLM_BASE_MODEL_PATH: str = "./ai/base_model/qwen2.5-7b-instruct"
    LLM_ADAPTER_PATH: str = "./ai/adapters/prism_lora"
    LLM_MAX_NEW_TOKENS: int = 150


settings = Settings()