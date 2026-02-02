from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Stock API"
    api_version: str = "v1"
    
    hours_between_news_fetch: int = 24  # Interval for fetching news
    
    # Database settings (if applicable)
    database_url: str = "sqlite:///./test.db"  # Example for SQLite, change as needed

    PERPLEXITY_API_KEY: str = ""

    # Other settings
    debug: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()