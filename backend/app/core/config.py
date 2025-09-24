from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    GCP_PROJECT_ID: str | None = None
    GCP_REGION: str | None = None
    GCS_BUCKET_NAME: str | None = None
    VERTEX_AI_MODEL_NAME: str | None = None
    VERTEX_AI_MODEL_REGION: str | None = None
    YOUTUBE_API_KEY: str | None = None
    BASIC_AUTH_USERNAME: str | None = None
    BASIC_AUTH_PASSWORD: str | None = None
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None
    VIDEO_ANALYSIS_START_OFFSET: str = "30s"
    VIDEO_ANALYSIS_END_OFFSET: str = "600s"
    GCP_IAM_SERVICE_ACCOUNT_EMAIL: str | None = None
    IMAGE_GENERATOR_REASONING_ENGINE_ID: str | None = None
    VEO_MODEL_NAME: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding='utf-8', 
        extra='ignore'
    )


settings = Settings()
