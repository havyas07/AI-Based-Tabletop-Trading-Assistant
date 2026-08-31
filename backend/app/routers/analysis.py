from fastapi import APIRouter, HTTPException
from app.models.schemas import PricePointAnalysisRequest, PricePointAnalysisResponse, AIAnalysisRequest, AIAnalysisResponse
from app.services.price_hit_service import analyze_price_point
from app.services.ai_service import get_ai_recommendation

router = APIRouter(prefix="/api/analyze", tags=["AI & Price Hit Analysis"])

@router.post("/price-point", response_model=PricePointAnalysisResponse)
def analyze_chart_point(req: PricePointAnalysisRequest):
    try:
        return analyze_price_point(
            symbol=req.symbol,
            selected_date=req.selected_date,
            selected_price=req.selected_price,
            tolerance_pct=req.tolerance_pct or 0.5,
            future_window_days=req.future_window_days or 5
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price-point analysis failed: {str(e)}")

@router.post("/ai", response_model=AIAnalysisResponse)
async def get_ai_decision(req: AIAnalysisRequest):
    try:
        return await get_ai_recommendation(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI decision engine failed: {str(e)}")
