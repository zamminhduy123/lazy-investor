import { useQuery, useQueries } from "@tanstack/react-query";
import { stocksApi } from "@/api/stocks";
import type {
  StockQuoteResponse,
  IntradayResponse,
  PriceDepthResponse,
  CompanyInfoResponse,
  ShareholdersResponse,
  PriceBoardResponse,
  SymbolsResponse,
  IndicesResponse,
  StockQuoteData,
  StockPerformanceData
} from "@/store/stocks/types";

/**
 * Hook to fetch stock quote/history data
 */
export function useStockQuote(
  symbol: string | null,
  options?: {
    startDate?: string;
    endDate?: string;
    interval?: "1D" | "1W" | "1M";
    enabled?: boolean;
  }
) {
  return useQuery<StockQuoteResponse>({
    queryKey: stocksApi.queryKeys.quote(symbol || "", {
      startDate: options?.startDate,
      endDate: options?.endDate,
      interval: options?.interval,
    }),
    queryFn: () =>
      stocksApi.getQuote<StockQuoteResponse>(symbol!, {
        startDate: options?.startDate,
        endDate: options?.endDate,
        interval: options?.interval,
      }) as Promise<StockQuoteResponse>,
    enabled: !!symbol && (options?.enabled !== false),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch intraday stock data
 */
export function useStockIntraday(symbol: string | null, enabled = true) {
  return useQuery<IntradayResponse>({
    queryKey: stocksApi.queryKeys.intraday(symbol || ""),
    queryFn: () =>
      stocksApi.getIntraday<IntradayResponse>(symbol!) as Promise<IntradayResponse>,
    enabled: !!symbol && enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch price depth (order book) data
 */
export function usePriceDepth(symbol: string | null, enabled = true) {
  return useQuery<PriceDepthResponse>({
    queryKey: stocksApi.queryKeys.priceDepth(symbol || ""),
    queryFn: () =>
      stocksApi.getPriceDepth<PriceDepthResponse>(symbol!) as Promise<PriceDepthResponse>,
    enabled: !!symbol && enabled,
    staleTime: 10 * 1000, // 10 seconds
  });
}

/**
 * Hook to fetch company information
 */
export function useCompanyInfo(symbol: string | null, enabled = true) {
  return useQuery<CompanyInfoResponse>({
    queryKey: stocksApi.queryKeys.company(symbol || ""),
    queryFn: () =>
      stocksApi.getCompanyInfo<CompanyInfoResponse>(symbol!) as Promise<CompanyInfoResponse>,
    enabled: !!symbol && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch company shareholders
 */
export function useShareholders(symbol: string | null, enabled = true) {
  return useQuery<ShareholdersResponse>({
    queryKey: stocksApi.queryKeys.shareholders(symbol || ""),
    queryFn: () =>
      stocksApi.getShareholders<ShareholdersResponse>(symbol!) as Promise<ShareholdersResponse>,
    enabled: !!symbol && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch price board for multiple symbols
 */
export function usePriceBoard(symbols: string[], enabled = true) {
  return useQuery<PriceBoardResponse>({
    queryKey: stocksApi.queryKeys.priceBoard(symbols),
    queryFn: () =>
      stocksApi.getPriceBoard<PriceBoardResponse>(symbols) as Promise<PriceBoardResponse>,
    enabled: symbols.length > 0 && enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch all available stock symbols
 */
export function useAllSymbols(enabled = true) {
  return useQuery<SymbolsResponse>({
    queryKey: stocksApi.queryKeys.symbols(),
    queryFn: () =>
      stocksApi.getAllSymbols<SymbolsResponse>() as Promise<SymbolsResponse>,
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch all indices
 */
export function useIndices(enabled = true) {
  return useQuery<IndicesResponse>({
    queryKey: stocksApi.queryKeys.indices(),
    queryFn: () =>
      stocksApi.getIndices<IndicesResponse>() as Promise<IndicesResponse>,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStockPerformance(symbol: string | null, enabled = true) {
  return useQuery<StockPerformanceData>({
    queryKey: stocksApi.queryKeys.stockPerformance(symbol || ""),
    queryFn: () =>
      stocksApi.getStockPerformance<StockPerformanceData>(symbol!) as Promise<StockPerformanceData>,
    enabled: !!symbol && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch multiple stock quotes in parallel
 */
export function useMultipleStockQuotes(
  symbols: string[],
  options?: {
    startDate?: string;
    endDate?: string;
    interval?: "1D" | "1W" | "1M";
    enabled?: boolean;
  }
) {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: stocksApi.queryKeys.quote(symbol, {
        startDate: options?.startDate,
        endDate: options?.endDate,
        interval: options?.interval,
      }),
      queryFn: () =>
        stocksApi.getQuote<StockQuoteResponse>(symbol, {
          startDate: options?.startDate,
          endDate: options?.endDate,
          interval: options?.interval,
        }) as Promise<StockQuoteResponse>,
      enabled: (options?.enabled !== false) && symbols.length > 0,
      staleTime: 60 * 1000, // 1 minute
    })),
  });
}

/**
 * Hook to get comprehensive stock data for a symbol
 * Combines multiple endpoints for a complete view
 */
export function useStockData(symbol: string | null, enabled = true) {
  const quote = useStockQuote(symbol, { enabled });
  const intraday = useStockIntraday(symbol, enabled);
  const companyInfo = useCompanyInfo(symbol, enabled);
  const priceDepth = usePriceDepth(symbol, enabled);

  console.log("Using stock data for:", symbol, quote, intraday, companyInfo, priceDepth);

  return {
    quote,
    intraday,
    companyInfo,
    priceDepth,
    isLoading: quote.isLoading || intraday.isLoading || companyInfo.isLoading || priceDepth.isLoading,
    isError: quote.isError || intraday.isError || companyInfo.isError || priceDepth.isError,
    error: quote.error || intraday.error || companyInfo.error || priceDepth.error,
  };
}
