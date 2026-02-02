from fastapi import APIRouter, HTTPException, Depends
from typing import Any
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.services.analysis import analyze_stock, analyze_stock_stream
from app.models.schemas import StockAnalysisResponse
from app.db.session import get_db
from app.db.models import AnalyzedArticle, WeeklySummary, Signal
from datetime import datetime, timedelta
from app.workers.news_analyzer import get_rate_limiter_stats
from app.workers import get_scheduler_status

router = APIRouter()


@router.get("/{symbol}", response_model=StockAnalysisResponse)
def analyze_stock_news(symbol: str, db: Session = Depends(get_db)) -> Any:
    """
    Get latest pre-analyzed intelligence for a stock (INSTANT from DB).
    
    For on-demand analysis (slow), use the /stream endpoint instead.
    """
    try:
        # Get latest 10 analyzed articles from DB
        articles = db.query(AnalyzedArticle).filter_by(
            symbol=symbol,
            is_relevant=True
        ).order_by(
            AnalyzedArticle.published_at.desc()
        ).limit(10).all()
        
        # Get current week's summary
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        weekly = db.query(WeeklySummary).filter_by(
            symbol=symbol,
            week_start=week_start
        ).first()
        
        # If no data in DB, fall back to legacy on-demand analysis
        if not articles:
            print(f"⚠️  No pre-analyzed data for {symbol}, running on-demand analysis...")
            return analyze_stock(symbol)
        
        # Return pre-analyzed data
        return {
            "symbol": symbol,
            "market_context": "",  # Context not stored in DB
            "articles": [
                {
                    "title": a.title,
                    "link": a.link,
                    "pubDate": a.published_at.isoformat(),
                    "analysis": {
                        "is_relevant": a.is_relevant,
                        "sentiment": a.sentiment,
                        "tldr": a.tldr,
                        "rationale": a.rationale,
                        "key_drivers": a.key_drivers,
                        "risks_or_caveats": a.risks_or_caveats,
                        "score": a.score,
                        "confidence": a.confidence
                    }
                }
                for a in articles
            ],
            "overall_summary": {
                "market_sentiment": weekly.trend_direction if weekly else "Unknown",
                "summary": weekly.outlook if weekly else "No weekly summary available yet. Background analysis will generate this soon.",
                "trend_analysis": weekly.momentum_shift if weekly else "",
                "confidence_score": int(weekly.avg_score) if weekly else 5
            } if weekly or len(articles) > 0 else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/stream")
def analyze_stock_news_stream(symbol: str):
    """
    Stream analysis progress in real-time using Server-Sent Events.
    Legacy on-demand analysis (slow). Prefer using pre-analyzed data from GET /{symbol}.
    """
    try:
        return StreamingResponse(
            analyze_stock_stream(symbol),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/signals/latest")
def get_latest_signals(
    unread_only: bool = True,
    limit: int = 20,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get investment signals (dividends, earnings, major events).
    These are automatically detected from analyzed news.
    """
    try:
        query = db.query(Signal)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        signals = query.filter(
            Signal.expires_at >= datetime.now()
        ).order_by(
            Signal.detected_at.desc()
        ).limit(limit).all()
        
        return {
            "signals": [
                {
                    "id": s.id,
                    "symbol": s.symbol,
                    "type": s.signal_type,
                    "priority": s.priority,
                    "title": s.title,
                    "description": s.description,
                    "detected_at": s.detected_at.isoformat(),
                    "expires_at": s.expires_at.isoformat() if s.expires_at else None
                }
                for s in signals
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/signals/{signal_id}/mark_read")
def mark_signal_read(signal_id: int, db: Session = Depends(get_db)) -> Any:
    """Mark a signal as read"""
    try:
        signal = db.query(Signal).filter_by(id=signal_id).first()
        if not signal:
            raise HTTPException(404, "Signal not found")
        
        signal.is_read = True
        db.commit()
        return {"status": "ok", "message": f"Signal {signal_id} marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
def get_system_status(db: Session = Depends(get_db)) -> Any:
    """
    Get system status including:
    - Background scheduler status
    - Rate limiter statistics
    - Database statistics
    """
    try:
        # Get scheduler status
        scheduler_status = get_scheduler_status()
        
        # Get rate limiter stats
        rate_limiter = get_rate_limiter_stats()
        
        # Get database stats
        total_articles = db.query(AnalyzedArticle).count()
        total_summaries = db.query(WeeklySummary).count()
        unread_signals = db.query(Signal).filter_by(is_read=False).count()
        
        # Get recent activity (last 24 hours)
        yesterday = datetime.now() - timedelta(hours=24)
        recent_articles = db.query(AnalyzedArticle).filter(
            AnalyzedArticle.analyzed_at >= yesterday
        ).count()
        
        return {
            "status": "operational",
            "timestamp": datetime.now().isoformat(),
            "scheduler": scheduler_status,
            "rate_limiter": {
                **rate_limiter,
                "status": "healthy" if rate_limiter["remaining"] > 5 else "near_limit",
                "warning": "Approaching rate limit" if rate_limiter["remaining"] <= 5 else None
            },
            "database": {
                "total_analyzed_articles": total_articles,
                "total_weekly_summaries": total_summaries,
                "unread_signals": unread_signals,
                "articles_last_24h": recent_articles
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/weekly")
def get_weekly_summary(symbol: str, db: Session = Depends(get_db)) -> Any:
    """
    Get weekly trend summary for a symbol.
    Includes sentiment distribution, key themes, and outlook.
    """
    try:
        # Get current week
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        weekly = db.query(WeeklySummary).filter_by(
            symbol=symbol,
            week_start=week_start
        ).first()
        
        if not weekly:
            raise HTTPException(404, f"No weekly summary available for {symbol} yet. Background analysis will generate this soon.")
        
        return {
            "symbol": symbol,
            "week_start": weekly.week_start.isoformat(),
            "week_end": weekly.week_end.isoformat(),
            "total_articles": weekly.total_articles,
            "sentiment_distribution": {
                "bullish": weekly.bullish_count,
                "bearish": weekly.bearish_count,
                "neutral": weekly.neutral_count
            },
            "avg_score": weekly.avg_score,
            "trend_direction": weekly.trend_direction,
            "key_themes": weekly.key_themes,
            "momentum_shift": weekly.momentum_shift,
            "outlook": weekly.outlook,
            "analyzed_at": weekly.analyzed_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))