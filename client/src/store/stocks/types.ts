/**
 * Stock data type definitions
 * These types represent the structure of data returned from the stock API
 */

export interface StockResponse<T = any> {
  symbol?: string;
  symbols?: string[];
  data?: T;
  count?: number;
  error?: string;
}

/**
 * Stock quote/history data point
 */
export interface StockQuoteData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Stock quote response
 */
export interface StockQuoteResponse extends StockResponse<StockQuoteData[]> {
  symbol: string;
  data: StockQuoteData[];
}

/**
 * Intraday stock data point
 */
export interface IntradayData {
  time: string;
  price: number;
  volume: number;
}

/**
 * Intraday stock response
 */
export interface IntradayResponse extends StockResponse<IntradayData[]> {
  symbol: string;
  data: IntradayData[];
}

/**
 * Price depth (order book) data
 */
export interface PriceDepthData {
  bid: Array<{ price: number; volume: number }>;
  ask: Array<{ price: number; volume: number }>;
}

/**
 * Price depth response
 */
export interface PriceDepthResponse extends StockResponse<PriceDepthData> {
  symbol: string;
  data: PriceDepthData;
}

/**
 * Company information
 */
export interface CompanyInfo {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  description?: string;
  [key: string]: any;
}

/**
 * Company info response
 */
export interface CompanyInfoResponse extends StockResponse<CompanyInfo> {
  symbol: string;
  data: CompanyInfo;
}

/**
 * Shareholder information
 */
export interface ShareholderData {
  name: string;
  shares: number;
  percentage: number;
  [key: string]: any;
}

/**
 * Shareholders response
 */
export interface ShareholdersResponse extends StockResponse<ShareholderData[]> {
  symbol: string;
  data: ShareholderData[];
}

/**
 * Price board entry (for multiple symbols)
 */
export interface PriceBoardEntry {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  [key: string]: any;
}

/**
 * Price board response
 */
export interface PriceBoardResponse extends StockResponse<PriceBoardEntry[]> {
  symbols: string[];
  data: PriceBoardEntry[];
}

/**
 * Available symbols response
 */
export interface SymbolsResponse extends StockResponse<string[]> {
  data: string[];
}

/**
 * Index information
 */
export interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  [key: string]: any;
}

/**
 * Indices response
 */
export interface IndicesResponse extends StockResponse<IndexData[]> {
  data: IndexData[];
}

/**
 * UI Stock representation (simplified for watchlist)
 */
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

export type StockSymbol = {
  symbol: string;
  exchange: string;
  type: string;
  organ_short_name: string;
  organ_name: string;
  product_grp_id: string;
}
