from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, Date, Boolean, Text, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class StockHistory(Base):
    __tablename__ = "stock_history"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    time = Column(Date, index=True)  # Use Date for daily data
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    interval = Column(String, default="1D", index=True)

    __table_args__ = (
        UniqueConstraint('symbol', 'time', 'interval', name='uix_symbol_time_interval'),
    )

class StockSymbol(Base):
    __tablename__ = "stock_symbols"

    symbol = Column(String, primary_key=True, index=True)
    name = Column(String)
    exchange = Column(String)


class StockNews(Base):
    __tablename__ = "stock_news"

    id = Column(Integer, primary_key=True, index=True)
    news_image_url = Column(String, nullable=True)
    symbol = Column(String, index=True)
    news_title = Column(String)
    news_link = Column(String)
    news_pub_date = Column(DateTime)
    source = Column(String)
    public_date = Column(Integer, nullable=True)
    fetched_at = Column(Date, index=True)
    ref_price = Column(Float, nullable=True)
    price_change_pct = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint('news_link', name='uix_news_link'),
    )


class AnalyzedArticle(Base):
    """Store AI-analyzed news articles"""
    __tablename__ = "analyzed_articles"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    title = Column(Text, nullable=False)
    link = Column(String, nullable=False)
    published_at = Column(DateTime, nullable=False, index=True)
    analyzed_at = Column(DateTime, default=func.now(), nullable=False)
    
    # AI Analysis Results
    is_relevant = Column(Boolean, nullable=True)
    sentiment = Column(String(20), nullable=True)  # Bullish/Bearish/Neutral
    tldr = Column(Text, nullable=True)
    rationale = Column(Text, nullable=True)
    key_drivers = Column(JSON, nullable=True)  # Array of strings
    risks_or_caveats = Column(JSON, nullable=True)  # Array of strings
    score = Column(Integer, nullable=True)  # 1-10 impact score
    confidence = Column(Float, nullable=True)  # 0.0-1.0
    
    __table_args__ = (
        UniqueConstraint('symbol', 'title', 'published_at', name='uix_article_dedup'),
    )


class WeeklySummary(Base):
    """Store weekly trend summaries for stocks"""
    __tablename__ = "weekly_summaries"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    week_start = Column(Date, nullable=False, index=True)
    week_end = Column(Date, nullable=False)
    
    # Aggregated Metrics
    total_articles = Column(Integer, nullable=False, default=0)
    bullish_count = Column(Integer, nullable=False, default=0)
    bearish_count = Column(Integer, nullable=False, default=0)
    neutral_count = Column(Integer, nullable=False, default=0)
    avg_score = Column(Float, nullable=True)
    
    # AI-Generated Insights
    trend_direction = Column(String(20), nullable=True)  # Improving/Declining/Stable/Volatile
    key_themes = Column(JSON, nullable=True)  # Array of themes
    momentum_shift = Column(Text, nullable=True)
    outlook = Column(Text, nullable=True)
    
    analyzed_at = Column(DateTime, default=func.now(), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('symbol', 'week_start', name='uix_weekly_summary'),
    )


class Signal(Base):
    """Investment signals (dividend announcements, earnings, major events)"""
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    signal_type = Column(String(50), nullable=False)  # dividend_announced, earnings_beat, major_contract, etc.
    priority = Column(String(20), nullable=False)  # high/medium/low
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=func.now(), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    # Link to source article
    article_id = Column(Integer, nullable=True)  # Foreign key to AnalyzedArticle


class Watchlist(Base):
    """Stocks to monitor for background analysis"""
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # For future multi-user support
    symbol = Column(String, nullable=False, index=True)
    added_at = Column(DateTime, default=func.now(), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'symbol', name='uix_user_watchlist'),
    )
