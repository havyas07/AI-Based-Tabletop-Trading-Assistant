from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health Check"])

@router.get("/api/health")
def health_check():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "ai_key_configured": bool(settings.AI_API_KEY)
    }
