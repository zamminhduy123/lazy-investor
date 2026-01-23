from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class StockQuoteParams(BaseModel):
    symbol: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    interval: Optional[str] = "1D"

class StockResponse(BaseModel):
    symbol: Optional[str] = None
    symbols: Optional[List[str]] = None
    data: Optional[dict] = None
    count: Optional[int] = None
    error: Optional[str] = None

class AnalysisResult(BaseModel):
    is_relevant: bool
    sentiment: str
    tldr: str
    score: int

class ArticleAnalysis(BaseModel):
    title: str
    link: str
    pubDate: Optional[str] = None
    analysis: Optional[AnalysisResult] = None
    
class StockAnalysisResponse(BaseModel):
    symbol: str
    market_context: str
    articles: List[ArticleAnalysis]
    overall_summary: Optional[Dict[str, Any]] = None