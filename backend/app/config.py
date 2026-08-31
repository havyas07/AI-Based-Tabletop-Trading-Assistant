import os
from dotenv import load_dotenv

class Settings:
    PROJECT_NAME: str = "AI-Based Tabletop Trading Assistant"
    VERSION: str = "1.0.0"
    
    @property
    def AI_API_KEY(self) -> str:
        load_dotenv(override=True)
        return os.getenv("AI_API_KEY", "").strip()

    @property
    def AI_MODEL(self) -> str:
        load_dotenv(override=True)
        return os.getenv("AI_MODEL", "gemini-1.5-flash").strip()

    @property
    def AI_PROVIDER(self) -> str:
        load_dotenv(override=True)
        return os.getenv("AI_PROVIDER", "gemini").strip()

    @property
    def AI_ENDPOINT(self) -> str:
        load_dotenv(override=True)
        return os.getenv("AI_ENDPOINT", "").strip()
    
    @property
    def MARKET_DATA_API_KEY(self) -> str:
        load_dotenv(override=True)
        return os.getenv("MARKET_DATA_API_KEY", "").strip()
    
    PRICE_HIT_TOLERANCE_PCT: float = float(os.getenv("PRICE_HIT_TOLERANCE_PCT", "0.5"))
    DEFAULT_FUTURE_WINDOW_DAYS: int = int(os.getenv("DEFAULT_FUTURE_WINDOW_DAYS", "5"))

settings = Settings()
