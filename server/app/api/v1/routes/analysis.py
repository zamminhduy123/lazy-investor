from fastapi import APIRouter, HTTPException
from typing import Any

from app.services import analysis_service
from app.models.schemas import StockAnalysisResponse

router = APIRouter()

@router.get("/{symbol}", response_model=StockAnalysisResponse)
def analyze_stock_news(symbol: str) -> Any:
    """
    Analyze stock news for a given symbol using Perplexity AI.
    """
    try:
        result = analysis_service.analyze_stock(symbol)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
