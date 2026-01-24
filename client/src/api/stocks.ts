import { fetchJson, getApiBaseUrl, toQueryString } from "./utils";
import { QuoteInterval, ApiResult, SymbolsApiResponse, ServerStockInfo } from "./types";
import { StockPerformance } from "./types";

const API_BASE_URL = getApiBaseUrl();
const STOCKS_BASE = `${API_BASE_URL}/api/v1/stocks`;

export const stocksApi = {
  urls: {
    quote: (
      symbol: string,
      params?: { startDate?: string; endDate?: string; interval?: QuoteInterval }
    ) =>
      `${STOCKS_BASE}/quote?symbol=${encodeURIComponent(symbol)}${toQueryString({
        startDate: params?.startDate,
        endDate: params?.endDate,
        interval: params?.interval,
      })}`,
    intraday: (symbol: string) =>
      `${STOCKS_BASE}/intraday?symbol=${encodeURIComponent(symbol)}`,
    priceDepth: (symbol: string) =>
      `${STOCKS_BASE}/price-depth?symbol=${encodeURIComponent(symbol)}`,
    company: (symbol: string) => `${STOCKS_BASE}/company?symbol=${encodeURIComponent(symbol)}`,
    shareholders: (symbol: string) =>
      `${STOCKS_BASE}/shareholders?symbol=${encodeURIComponent(symbol)}`,
    priceBoard: (symbols: string[]) =>
      `${STOCKS_BASE}/price-board${toQueryString({
        symbols: symbols.map((s) => s.trim()).filter(Boolean).join(","),
      })}`,
    stockInfo: (symbols: string[]) =>
      `${STOCKS_BASE}/stock-info${toQueryString({
        symbols: symbols.map((s) => s.trim()).filter(Boolean).join(","),
      })}`,
    stockPerformance: (symbol: string) =>
      `${STOCKS_BASE}/stock-performance${toQueryString({ symbol })}`,
    symbols: () => `${STOCKS_BASE}/all-symbols`,
    indices: () => `${STOCKS_BASE}/indices`,
  },

  /**
   * React-query friendly query keys.
   * Use as: useQuery({ queryKey: stocksApi.queryKeys.quote("HPG"), ... })
   */
  queryKeys: {
    quote: (
      symbol: string,
      params?: { startDate?: string; endDate?: string; interval?: QuoteInterval }
    ) => [stocksApi.urls.quote(symbol, params)] as const,
    intraday: (symbol: string) => [stocksApi.urls.intraday(symbol)] as const,
    priceDepth: (symbol: string) => [stocksApi.urls.priceDepth(symbol)] as const,
    company: (symbol: string) => [stocksApi.urls.company(symbol)] as const,
    shareholders: (symbol: string) => [stocksApi.urls.shareholders(symbol)] as const,
    priceBoard: (symbols: string[]) => [stocksApi.urls.priceBoard(symbols)] as const,
    symbols: () => [stocksApi.urls.symbols()] as const,
    indices: () => [stocksApi.urls.indices()] as const,
    stockPerformance: (symbol: string) => [stocksApi.urls.stockPerformance(symbol)] as const,
  },

  getQuote: <T = unknown>(
    symbol: string,
    params?: { startDate?: string; endDate?: string; interval?: QuoteInterval },
    options?: { signal?: AbortSignal }
  ) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.quote(symbol, params), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getIntraday: <T = unknown>(symbol: string, options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.intraday(symbol), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getPriceDepth: <T = unknown>(symbol: string, options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.priceDepth(symbol), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getCompanyInfo: <T = unknown>(symbol: string, options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.company(symbol), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getShareholders: <T = unknown>(symbol: string, options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.shareholders(symbol), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getPriceBoard: <T = unknown>(symbols: string[], options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.priceBoard(symbols), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getStockInfo: <T = ServerStockInfo>(symbols: string[], options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.stockInfo(symbols), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getAllSymbols: <T = SymbolsApiResponse>(options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.symbols(), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getIndices: <T = unknown>(options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.indices(), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),

  getStockPerformance: <T = StockPerformance>(symbol: string, options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(stocksApi.urls.stockPerformance(symbol), {
      signal: options?.signal,
      logPrefix: "[stocksApi]",
    }),
};
