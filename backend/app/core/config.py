"""
Application configuration settings
"""
import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ALCHEMY_API_KEY: str = os.getenv("ALCHEMY_API_KEY", "")
    COINGECKO_API_KEY: str = os.getenv("COINGECKO_API_KEY", "")
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # AI Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai")  # "openai" or "gemini"
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4-turbo-preview")
    
    # Rate Limiting
    RATE_LIMIT: str = "100/minute"
    
    class Config:
        env_file = ".env"


settings = Settings()
