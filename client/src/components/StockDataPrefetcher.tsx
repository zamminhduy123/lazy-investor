import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { stocksApi } from "@/api/stocks";
import { useStockStore } from "@/store/stocks/stockStore";
import { Stock } from "@/store/stocks/types";

/**
 * StockDataPrefetcher Component
 * 
 * Prefetches stock data in the background when the app loads.
 * This ensures data is available immediately when users interact with the app.
 */
export function StockDataPrefetcher() {
  const queryClient = useQueryClient();
  const { watchlist } = useStockStore();

  useEffect(() => {
    // Prefetch all available symbols (for search/autocomplete)
    queryClient.prefetchQuery({
      queryKey: stocksApi.queryKeys.symbols(),
      queryFn: () => stocksApi.getAllSymbols(),
    });

    // Prefetch indices (for market overview)
    queryClient.prefetchQuery({
      queryKey: stocksApi.queryKeys.indices(),
      queryFn: () => stocksApi.getIndices(),
    });

    // Prefetch price board for watchlist symbols (if any)
    if (watchlist.length > 0) {
      // Prefetch basic quote data for each watchlist symbol
      watchlist.forEach((stock) => {
        queryClient.prefetchQuery({
          queryKey: stocksApi.queryKeys.quote(stock.symbol),
          queryFn: async () => {
            const data = await stocksApi.getStockInfo([stock.symbol]) as any
            return {
              symbol: data.data[0],
              price: data.close,
              change: data.change,
              changePercent: data.change_percentage,
              volume: data.volume.toString(),
            }
          },
        });
      });
    }
  }, [queryClient, watchlist]);

  // This component doesn't render anything
  return null;
}
