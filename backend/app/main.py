from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import market, analysis, health

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Phase 1 Backend API for AI-Based Tabletop Trading Assistant"
)

# Enable CORS for local development (frontend on Vite port 5173 or any port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router)
app.include_router(market.router)
app.include_router(analysis.router)

@app.get("/")
def root():
    return {
        "message": "AI-Based Tabletop Trading Assistant API Server",
        "documentation": "/docs",
        "health": "/api/health"
    }
