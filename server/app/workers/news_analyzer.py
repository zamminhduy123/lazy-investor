"""
Background News Analyzer Worker
Continuously fetches and analyzes news for watchlist stocks
"""

import asyncio
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from newspaper import Article
import time
from collections import deque

from app.db.models import AnalyzedArticle, WeeklySummary, Signal, Watchlist
from app.services import news_service, stocks_service
from app.services.analysis import analyze_single_article, analyze_weekly_trends


# Rate limiter for vnstock API (20 requests per minute)
class RateLimiter:
    def __init__(self, max_requests: int = 20, time_window: int = 60):
        """
        Args:
            max_requests: Maximum number of requests allowed
            time_window: Time window in seconds (default 60 = 1 minute)
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
    
    def wait_if_needed(self):
        """
        Check if we've exceeded rate limit and wait if necessary
        """
        now = time.time()
        
        # Remove requests older than time window
        while self.requests and self.requests[0] < now - self.time_window:
            self.requests.popleft()
        
        # If we've hit the limit, wait until oldest request expires
        if len(self.requests) >= self.max_requests:
            wait_time = self.time_window - (now - self.requests[0]) + 1  # +1 for safety margin
            if wait_time > 0:
                print(f"⏳ Rate limit reached ({self.max_requests} requests/minute). Waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
                # Clean up old requests after waiting
                now = time.time()
                while self.requests and self.requests[0] < now - self.time_window:
                    self.requests.popleft()
        
        # Record this request
        self.requests.append(time.time())
    
    def get_stats(self):
        """Get current rate limiter statistics"""
        now = time.time()
        # Count requests in current window
        recent = sum(1 for req_time in self.requests if req_time >= now - self.time_window)
        return {
            "requests_in_window": recent,
            "max_requests": self.max_requests,
            "time_window": self.time_window,
            "remaining": self.max_requests - recent
        }


# Global rate limiter instance
vnstock_rate_limiter = RateLimiter(max_requests=20, time_window=60)


async def analyze_watchlist_stocks(db: Session):
    """
    Main background job: Analyze all stocks in watchlist
    Run this every 2-4 hours via APScheduler or Celery
    """
    print(f"\n{'='*60}")
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting watchlist analysis...")
    print(f"{'='*60}\n")
    
    # Show rate limiter stats
    stats = vnstock_rate_limiter.get_stats()
    print(f"📊 Rate Limiter: {stats['requests_in_window']}/{stats['max_requests']} requests in last {stats['time_window']}s")
    print(f"   Remaining: {stats['remaining']} requests available\n")
    
    # Get all symbols to monitor
    watchlist_symbols = db.query(Watchlist.symbol).distinct().all()
    symbols = [s[0] for s in watchlist_symbols]
    
    if not symbols:
        print("⚠️  No stocks in watchlist. Add stocks to monitor.")
        print("   Example: INSERT INTO watchlist (symbol) VALUES ('HPG'), ('VNM'), ('VCB');")
        return
    
    print(f"📋 Monitoring {len(symbols)} stocks: {', '.join(symbols)}\n")
    
    for idx, symbol in enumerate(symbols, 1):
        try:
            print(f"[{idx}/{len(symbols)}] Processing {symbol}...")
            await analyze_symbol_news(db, symbol)
        except Exception as e:
            print(f"❌ Error analyzing {symbol}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'='*60}")
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Completed watchlist analysis")
    
    # Final stats
    final_stats = vnstock_rate_limiter.get_stats()
    print(f"📊 Total API calls made: {final_stats['requests_in_window']}/{final_stats['max_requests']}")
    print(f"{'='*60}\n")


async def analyze_symbol_news(db: Session, symbol: str):
    """Analyze recent news for a single symbol"""
    print(f"\n📊 Analyzing {symbol}...")
    print("-" * 40)
    
    # Rate limit check before making API call
    vnstock_rate_limiter.wait_if_needed()
    
    # 1. Get latest news (check past 6 hours only to avoid re-processing old news)
    cutoff_time = datetime.now() - timedelta(hours=6)
    news_response = news_service.get_company_news(symbol, limit=20)
    news_list = news_response.get('data', [])
    
    # 2. Filter out already-analyzed articles
    new_articles = []
    for news in news_list:
        title = news.get('title') or news.get('news_title')
        
        # Check if already in DB
        existing = db.query(AnalyzedArticle).filter_by(
            symbol=symbol,
            title=title
        ).first()
        
        if not existing:
            new_articles.append(news)
    
    if not new_articles:
        print(f"✓ {symbol}: No new articles (all analyzed)")
        return
    
    print(f"📰 {symbol}: Found {len(new_articles)} new articles to analyze\n")
    
    # 3. Get market context (once per symbol)
    # Rate limit check before API call
    vnstock_rate_limiter.wait_if_needed()
    context = stocks_service.get_market_context(symbol)
    
    # 4. Analyze each new article
    for idx, news in enumerate(new_articles):
        await analyze_and_store_article(db, symbol, context, news, idx + 1, len(new_articles))
    
    # 5. Check for signals (dividend announcements, major events)
    await detect_signals(db, symbol)
    
    # 6. Generate weekly summary if it's Monday or new week
    await update_weekly_summary(db, symbol)


async def analyze_and_store_article(
    db: Session, 
    symbol: str, 
    context: str, 
    news: dict,
    idx: int,
    total: int
):
    """Analyze single article and store in DB"""
    title = news.get('title') or news.get('news_title')
    link = news.get('link') or news.get('news_link')
    pub_date_str = news.get('published') or news.get('news_pub_date')
    
    if not link:
        return
    
    print(f"  [{idx}/{total}] {title[:60]}...")
    
    # Scrape and analyze
    try:
        article = Article(link)
        article.download()
        article.parse()
        
        analysis = analyze_single_article(
            symbol, context, title, article.text, use_cache=False
        )
        
    except Exception as e:
        print(f"      ❌ Failed: {str(e)[:50]}")
        return
    
    # Parse published date
    try:
        pub_date = datetime.fromisoformat(pub_date_str.replace('Z', '+00:00'))
    except:
        pub_date = datetime.now()
    
    # Store in database
    analyzed = AnalyzedArticle(
        symbol=symbol,
        title=title,
        link=link,
        published_at=pub_date,
        is_relevant=analysis.get('is_relevant'),
        sentiment=analysis.get('sentiment'),
        tldr=analysis.get('tldr'),
        rationale=analysis.get('rationale'),
        key_drivers=analysis.get('key_drivers'),
        risks_or_caveats=analysis.get('risks_or_caveats'),
        score=analysis.get('score'),
        confidence=analysis.get('confidence')
    )
    
    db.add(analyzed)
    db.commit()
    
    sentiment_emoji = {
        'Bullish': '📈',
        'Bearish': '📉',
        'Neutral': '➡️'
    }.get(analysis.get('sentiment'), '❓')
    
    print(f"      ✓ {sentiment_emoji} {analysis.get('sentiment')} (Score: {analysis.get('score')}/10)")


async def detect_signals(db: Session, symbol: str):
    """
    Detect investment signals from recent articles
    - Dividend announcements
    - Earnings beats
    - Major contracts
    """
    # Get articles from past 24 hours
    recent = db.query(AnalyzedArticle).filter(
        AnalyzedArticle.symbol == symbol,
        AnalyzedArticle.published_at >= datetime.now() - timedelta(hours=24),
        AnalyzedArticle.is_relevant == True
    ).all()
    
    signals_detected = 0
    
    for article in recent:
        # Check for dividend signals
        if any(keyword in article.title.lower() for keyword in ['cổ tức', 'dividend', 'phân phối', 'chia cổ']):
            # Create signal if not already exists
            existing = db.query(Signal).filter_by(article_id=article.id).first()
            
            if not existing and article.score >= 6:
                signal = Signal(
                    symbol=symbol,
                    signal_type='dividend_announced',
                    priority='high' if article.score >= 8 else 'medium',
                    title=f"💰 {symbol}: Dividend Announcement",
                    description=article.tldr,
                    article_id=article.id,
                    expires_at=datetime.now() + timedelta(days=30)
                )
                db.add(signal)
                signals_detected += 1
                print(f"  🚨 Signal: {signal.title}")
        
        # Check for earnings/revenue beats
        if any(keyword in article.title.lower() for keyword in ['doanh thu', 'lợi nhuận', 'kết quả kinh doanh', 'earnings']):
            existing = db.query(Signal).filter_by(article_id=article.id).first()
            
            if not existing and article.sentiment == 'Bullish' and article.score >= 7:
                signal = Signal(
                    symbol=symbol,
                    signal_type='earnings_beat',
                    priority='high',
                    title=f"📈 {symbol}: Strong Earnings Signal",
                    description=article.tldr,
                    article_id=article.id,
                    expires_at=datetime.now() + timedelta(days=7)
                )
                db.add(signal)
                signals_detected += 1
                print(f"  🚨 Signal: {signal.title}")
        
        # Check for major contracts
        if any(keyword in article.title.lower() for keyword in ['hợp đồng', 'dự án', 'contract', 'partnership']):
            existing = db.query(Signal).filter_by(article_id=article.id).first()
            
            if not existing and article.sentiment == 'Bullish' and article.score >= 7:
                signal = Signal(
                    symbol=symbol,
                    signal_type='major_contract',
                    priority='medium',
                    title=f"📋 {symbol}: Major Contract/Partnership",
                    description=article.tldr,
                    article_id=article.id,
                    expires_at=datetime.now() + timedelta(days=14)
                )
                db.add(signal)
                signals_detected += 1
                print(f"  🚨 Signal: {signal.title}")
    
    if signals_detected > 0:
        db.commit()
        print(f"  ✓ Detected {signals_detected} new signals")


async def update_weekly_summary(db: Session, symbol: str):
    """Generate/update weekly trend summary for a symbol"""
    # Only run on Mondays or if no summary exists for current week
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)  # Sunday
    
    existing = db.query(WeeklySummary).filter_by(
        symbol=symbol,
        week_start=week_start
    ).first()
    
    # Skip if not Monday and already exists
    if existing and datetime.now().weekday() != 0:
        return
    
    # Get all articles from this week
    articles = db.query(AnalyzedArticle).filter(
        AnalyzedArticle.symbol == symbol,
        AnalyzedArticle.published_at >= datetime.combine(week_start, datetime.min.time()),
        AnalyzedArticle.published_at <= datetime.combine(week_end, datetime.max.time())
    ).all()
    
    if len(articles) < 3:  # Need minimum data
        print(f"  ⏭️  {symbol}: Not enough articles this week ({len(articles)}) for weekly summary")
        return
    
    # Aggregate metrics
    total = len(articles)
    bullish = sum(1 for a in articles if a.sentiment == 'Bullish')
    bearish = sum(1 for a in articles if a.sentiment == 'Bearish')
    neutral = total - bullish - bearish
    avg_score = sum(a.score for a in articles if a.score) / total
    
    # AI-generated weekly insights
    print(f"  📊 Generating weekly summary ({total} articles)...")
    trend_data = analyze_weekly_trends(symbol, articles)
    
    # Upsert weekly summary
    if existing:
        existing.total_articles = total
        existing.bullish_count = bullish
        existing.bearish_count = bearish
        existing.neutral_count = neutral
        existing.avg_score = avg_score
        existing.trend_direction = trend_data.get('trend_direction')
        existing.key_themes = trend_data.get('key_themes')
        existing.momentum_shift = trend_data.get('momentum_shift')
        existing.outlook = trend_data.get('outlook')
        existing.analyzed_at = datetime.now()
    else:
        summary = WeeklySummary(
            symbol=symbol,
            week_start=week_start,
            week_end=week_end,
            total_articles=total,
            bullish_count=bullish,
            bearish_count=bearish,
            neutral_count=neutral,
            avg_score=avg_score,
            trend_direction=trend_data.get('trend_direction'),
            key_themes=trend_data.get('key_themes'),
            momentum_shift=trend_data.get('momentum_shift'),
            outlook=trend_data.get('outlook')
        )
        db.add(summary)
    
    db.commit()
    print(f"  ✓ Weekly summary updated: {trend_data.get('trend_direction')} (Avg score: {avg_score:.1f}/10)")


def get_rate_limiter_stats():
    """
    Get current rate limiter statistics
    Can be exposed via API endpoint for monitoring
    """
    return vnstock_rate_limiter.get_stats()


def reset_rate_limiter():
    """
    Reset rate limiter (for testing or manual intervention)
    """
    vnstock_rate_limiter.requests.clear()
    print("✓ Rate limiter reset")
