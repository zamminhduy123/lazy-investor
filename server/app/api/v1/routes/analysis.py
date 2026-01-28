from fastapi import APIRouter, HTTPException
from typing import Any
from fastapi.responses import StreamingResponse

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

@router.get("/{symbol}/stream")
def analyze_stock_news_stream(symbol: str):
    """
    Stream analysis progress in real-time using Server-Sent Events.
    """
    try:
        return StreamingResponse(
            analysis_service.analyze_stock_stream(symbol),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))