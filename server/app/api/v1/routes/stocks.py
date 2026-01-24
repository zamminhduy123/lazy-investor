from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, Query, HTTPException

from app.services import stocks_service

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/quote")
def quote(
    symbol: str = Query(..., min_length=1),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    interval: str = "1D",
):
    result = stocks_service.get_stock_quote(symbol, startDate, endDate, interval)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/intraday")
def intraday(symbol: str = Query(..., min_length=1)):
    result = stocks_service.get_stock_intraday(symbol)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/price-depth")
def price_depth(symbol: str = Query(..., min_length=1)):
    result = stocks_service.get_stock_price_depth(symbol)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/company")
def company(symbol: str = Query(..., min_length=1)):
    result = stocks_service.get_company_info(symbol)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/shareholders")
def shareholders(symbol: str = Query(..., min_length=1)):
    result = stocks_service.get_company_shareholders(symbol)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/price-board")
def price_board(symbols: str = Query(..., description="Comma-separated symbols, e.g. VNM,HPG")):
    parsed: List[str] = [s.strip() for s in symbols.split(",")]
    # print("Parsed symbols:", parsed)
    result = stocks_service.get_price_board(parsed)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/stock-info")
def stock_info(symbols: str = Query(..., description="Comma-separated symbols, e.g. VNM,HPG")):
    parsed: List[str] = [s.strip() for s in symbols.split(",")]
    print("Parsed symbols:", parsed)
    result = stocks_service.get_stock_info(parsed)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/stock-performance")
def stock_performance(symbol: str = Query(..., min_length=1)):
    result = stocks_service.get_stock_performance(symbol)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/all-symbols")
def all_symbols():
    result = stocks_service.get_all_symbols()
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/indices")
def indices():
    # indices returns empty array if none, not an error
    return stocks_service.get_indices()