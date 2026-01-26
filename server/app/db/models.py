from sqlalchemy import Column, Integer, String, Float, DateTime, UniqueConstraint, Date
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

