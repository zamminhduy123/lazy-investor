// Common and Shared Types
export interface ApiError {
  error: string;
}

export type ApiResult<T> = T | ApiError;

// Stocks Types
export interface ServerStockSymbol {
  symbol: string;
  organName: string;
  comGroupCode: string; // e.g., "HOSE", "HNX"
}

export type QuoteInterval = "1D" | "1W" | "1M";

export interface SymbolsApiResponse {
  data: ServerStockSymbol[];
  count: number;
  status: string;
}

// Analysis Types
export interface ArticleAnalysis {
  is_relevant: boolean;
  relevance_reason: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  tldr: string;
  rationale: string;
  key_drivers: string[];
  risks_or_caveats: string[];
  score: number;
  confidence: number;
}

export interface AnalyzedArticle {
  title: string;
  link: string;
  pubDate: string;
  analysis: ArticleAnalysis | null;
  
}

export interface MarketSummary {
  summary: string;
  market_sentiment: "Bullish" | "Bearish" | "Neutral" | "Volatile";
  trend_analysis: string;
  confidence_score: number;
}

export interface StockAnalysisResponse {
  symbol: string;
  market_context: string;
  articles: AnalyzedArticle[];
  overall_summary: MarketSummary | null;
}

export interface ServerStockInfo {
  close: number;
  change: number;
  change_percentage: number;
  volume: number;
}

export interface StockPerformance {
  "1W": string; // e.g., "+3.5%"
  "1M": string; // e.g., "-1.2%"
  "6M": string; // e.g., "+10.0%"
  "1Y": string; // e.g., "-5.0%"
}