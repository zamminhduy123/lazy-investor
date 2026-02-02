from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from datetime import date
from app.services import news_service


router = APIRouter(prefix="/news", tags=["news"])


@router.get("/company")
def company_news(
    symbol: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
    fallbackToGoogle: bool = True,
):
    result = news_service.get_company_news(
        symbol=symbol,
        limit=limit,
        fallback_to_google=fallbackToGoogle,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/dev-company")
def dev_company_news(
    symbol: str = Query(..., min_length=1),
):
    result = news_service.get_news_from_db(
        symbol=symbol,
        date=date.today(),
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result