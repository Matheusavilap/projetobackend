from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "dev"
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    database_url: str
    redis_url: str

    jwt_secret: str
    jwt_issuer: str = "softruck-location"
    jwt_audience: str = "softruck-frontend"
    access_token_ttl_seconds: int = 3600

    class Config:
        env_file = ".env"


settings = Settings()
