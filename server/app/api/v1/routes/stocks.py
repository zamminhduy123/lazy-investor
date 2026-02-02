from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session

from app.services import stocks_service
from app.db.session import get_db
from app.db.models import Watchlist

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

@router.get("/dividend-history")
def dividend_history(symbol: str = Query(..., min_length=1)):
    result = stocks_service.get_stock_dividends(symbol)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/all-symbols")
def all_symbols():
    result = stocks_service.get_all_symbols()
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/watchlist")
def get_watchlist(db: Session = Depends(get_db)):
    """
    Get all stocks in the watchlist with their stock info.
    These stocks are monitored by the background analysis worker.
    """
    try:
        watchlist_items = db.query(Watchlist).filter_by(user_id=None).all()
        
        # Get symbols
        symbols = [item.symbol for item in watchlist_items]
        
        # Fetch stock info for all symbols in one call
        stock_info_result = {}
        if symbols:
            stock_info_response = stocks_service.get_stock_info(symbols)
            if "error" not in stock_info_response and "data" in stock_info_response:
                # stock_info_response["data"] is a dict with symbol keys
                # e.g., {"HPG": {...}, "VNM": {...}}
                stock_info_result = stock_info_response["data"]
        
        return {
            "status": "success",
            "data": [
                {
                    "id": item.id,
                    "symbol": item.symbol,
                    "added_at": item.added_at.isoformat(),
                    "stock_info": stock_info_result.get(item.symbol)
                }
                for item in watchlist_items
            ],
            "total": len(watchlist_items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/watchlist")
def add_to_watchlist(symbol: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """
    Add a stock to the watchlist for background monitoring.
    """
    try:
        # Check if already exists
        existing = db.query(Watchlist).filter_by(symbol=symbol, user_id=None).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"{symbol} is already in watchlist")
        
        # Add to watchlist
        watchlist_item = Watchlist(symbol=symbol, user_id=None)
        db.add(watchlist_item)
        db.commit()
        db.refresh(watchlist_item)
        
        # Fetch stock info for the added symbol
        stock_info_response = stocks_service.get_stock_info([symbol])
        stock_info = None
        if "error" not in stock_info_response and "data" in stock_info_response:
            # stock_info_response["data"] is a dict with symbol keys
            # e.g., {"HPG": {...}}
            stock_info = stock_info_response["data"].get(symbol)
        
        return {
            "status": "success",
            "message": f"{symbol} added to watchlist",
            "data": {
                "id": watchlist_item.id,
                "symbol": watchlist_item.symbol,
                "added_at": watchlist_item.added_at.isoformat(),
                "stock_info": stock_info
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/watchlist/{symbol}")
def remove_from_watchlist(symbol: str, db: Session = Depends(get_db)):
    """
    Remove a stock from the watchlist.
    """
    try:
        watchlist_item = db.query(Watchlist).filter_by(symbol=symbol, user_id=None).first()
        if not watchlist_item:
            raise HTTPException(status_code=404, detail=f"{symbol} not found in watchlist")
        
        db.delete(watchlist_item)
        db.commit()
        
        return {
            "status": "success",
            "message": f"{symbol} removed from watchlist"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indices")
def indices():
    # indices returns empty array if none, not an error
    return stocks_service.get_indices()