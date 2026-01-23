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
    symbol = Column(String, index=True)
    title = Column(String)
    link = Column(String)
    published = Column(DateTime) # Store parseable datetime or string if needed, DateTime is better
    source = Column(String)
    fetched_at = Column(Date, index=True) # To know which "day" we fetched this for

    __table_args__ = (
        # Avoid duplicate news for same symbol? Link is good unique identifier usually.
        # But keeping it simple for now, maybe just unique on link?
        UniqueConstraint('link', name='uix_news_link'),
    )

