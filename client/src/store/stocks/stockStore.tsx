import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Stock } from "./types";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/hooks/useStocks";

/**
 * Stock Store Context
 * Manages watchlist (synced with server) and selected symbol state
 */
interface StockStoreContextValue {
  watchlist: Stock[];
  selectedSymbol: string | null;
  addToWatchlist: (stock: Stock) => void;
  setWatchlist: (stocks: Stock[]) => void;
  removeFromWatchlist: (symbol: string) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  isInWatchlist: (symbol: string) => boolean;
  updateItemInWatchlist: (stock: Stock) => void;
  isLoading: boolean;
}

const StockStoreContext = createContext<StockStoreContextValue | undefined>(undefined);

interface StockStoreProviderProps {
  children: ReactNode;
  initialWatchlist?: Stock[];
}

export function StockStoreProvider({ 
  children, 
  initialWatchlist = [] 
}: StockStoreProviderProps) {
  // Fetch watchlist from server
  const { data: watchlistData, isLoading: isLoadingWatchlist } = useWatchlist();
  const addToWatchlistMutation = useAddToWatchlist();
  const removeFromWatchlistMutation = useRemoveFromWatchlist();

  // Local state for watchlist (synced with server)
  const [watchlist, setWatchlist] = useState<Stock[]>(initialWatchlist);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Sync server data to local state
  useEffect(() => {
    if (watchlistData?.data) {
      // Convert server format to Stock format, using embedded stock_info if available
      const stocks: Stock[] = watchlistData.data.map(item => ({
        symbol: item.symbol,
        name: item.symbol,
        exchange: "HOSE",
        price: item.stock_info?.close ?? 0,
        change: item.stock_info?.change ?? 0,
        changePercent: item.stock_info?.change_percentage ?? 0,
        volume: item.stock_info?.volume ?? 0,
      }));
      setWatchlist(stocks);
    }
  }, [watchlistData]);

  const addToWatchlist = useCallback((stock: Stock) => {
    // Optimistically update UI
    setWatchlist((prev) => {
      if (prev.find((s) => s.symbol === stock.symbol)) {
        return prev;
      }
      return [...prev, stock];
    });
    
    // Sync to server
    addToWatchlistMutation.mutate(stock.symbol, {
      onError: () => {
        // Rollback on error
        setWatchlist((prev) => prev.filter((s) => s.symbol !== stock.symbol));
      }
    });
  }, [addToWatchlistMutation]);

  const updateItemInWatchlist = useCallback((stock: Stock) => {
    setWatchlist((prev) => {
      const index = prev.findIndex((s) => s.symbol === stock.symbol);
      if (index === -1) {
        return prev;
      }
      const newWatchlist = [...prev];
      newWatchlist[index] = stock;
      return newWatchlist;
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    // Optimistically update UI
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
    // Clear selection if removed stock was selected
    setSelectedSymbol((prev) => (prev === symbol ? null : prev));
    
    // Sync to server
    removeFromWatchlistMutation.mutate(symbol, {
      onError: () => {
        // Rollback on error - refetch from server
        // The useEffect will restore the correct state
      }
    });
  }, [removeFromWatchlistMutation]);

  const isInWatchlist = useCallback(
    (symbol: string) => watchlist.some((s) => s.symbol === symbol),
    [watchlist]
  );

  const value: StockStoreContextValue = {
    watchlist,
    selectedSymbol,
    addToWatchlist,
    removeFromWatchlist,
    setSelectedSymbol,
    isInWatchlist,
    setWatchlist,
    updateItemInWatchlist,
    isLoading: isLoadingWatchlist,
  };

  return (
    <StockStoreContext.Provider value={value}>
      {children}
    </StockStoreContext.Provider>
  );
}

/**
 * Hook to access stock store
 */
export function useStockStore() {
  const context = useContext(StockStoreContext);
  if (context === undefined) {
    throw new Error("useStockStore must be used within a StockStoreProvider");
  }
  return context;
}
