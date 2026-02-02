/**
 * Custom Hooks for Stock Data
 * 
 * These hooks provide easy access to stock data using React Query.
 * All hooks handle loading states, errors, and caching automatically.
 * 
 * @example
 * ```tsx
 * import { useStockQuote, useStockData } from '@/hooks/useStocks';
 * 
 * function StockChart({ symbol }: { symbol: string }) {
 *   const { data, isLoading, error } = useStockQuote(symbol);
 *   // ...
 * }
 * ```
 */

export * from "./useStocks";
export * from "./useSignals";
export * from "./useStockAnalysisStream";
