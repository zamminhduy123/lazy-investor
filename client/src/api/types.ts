// Common and Shared Types
export interface ApiError {
  error: string;
}
// { status: "ok", symbol, items: [{ title, link/url, published_at }, ...], source: "vci|google" }
export interface ApiSuccess<T> {
  status: "ok";
  symbol: string;
  data: T;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

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

export interface ServerDividendEvent {
  date: string; // e.g., "2023-06-15"
  title: string; // e.g., "2023 Interim Dividend"
  type: "Cash" | "Stock";
  amount_per_share: number; // e.g., 1000 for 1000 VND
  yield_percentage: number; // e.g., 2.5 for 2.5%
  ratio?: number; // e.g., 0.1 for 10% stock dividend
  price_at_ex: number; // e.g., 40000 for 40,000 VND
}

export interface ServerNews {
  id: string;
  new_id: string;
  title: string;
  news_title: string;
  link: string;
  news_full_content: string;
  news_short_content: string;
  public_date: number; // mili
  ref_price: string;
  news_image_url: string;
  source: string;
  price_change_pct: number;
}