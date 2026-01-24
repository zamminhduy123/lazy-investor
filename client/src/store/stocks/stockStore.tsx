import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Stock } from "./types";

/**
 * Stock Store Context
 * Manages watchlist and selected symbol state
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
}

const STORAGE_KEY = "stock-me-watchlist";

const StockStoreContext = createContext<StockStoreContextValue | undefined>(undefined);

interface StockStoreProviderProps {
  children: ReactNode;
  initialWatchlist?: Stock[];
}
function saveWatchlistToStorage(watchlist: Stock[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    console.log("Saved watchlist to localStorage:", watchlist);
  } catch (e) {
    console.error("Failed to save watchlist", e);
  }
}

export function StockStoreProvider({ 
  children, 
  initialWatchlist = [] 
}: StockStoreProviderProps) {


  
  // 1. Initialize state lazy-loading from localStorage
  const [watchlist, setWatchlist] = useState<Stock[]>(() => {
    if (initialWatchlist.length > 0) return initialWatchlist;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log("Loaded watchlist from localStorage:", stored);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load watchlist", e);
      return [];
    }
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const addToWatchlist = useCallback((stock: Stock) => {
    setWatchlist((prev) => {
      if (prev.find((s) => s.symbol === stock.symbol)) {
        return prev;
      }
      return [...prev, stock];
    });
    saveWatchlistToStorage([...watchlist, stock]);
  }, [watchlist]);

  const updateItemInWatchlist = useCallback((stock: Stock) => {
    setWatchlist((prev) => {
      const index = prev.findIndex((s) => s.symbol === stock.symbol);
      if (index === -1) {
        return prev;
      }
      const newWatchlist = [...prev];
      newWatchlist[index] = stock;
      saveWatchlistToStorage(newWatchlist);
      return newWatchlist;
    });
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
    // Clear selection if removed stock was selected
    setSelectedSymbol((prev) => (prev === symbol ? null : prev));
    saveWatchlistToStorage(watchlist.filter((s) => s.symbol !== symbol));
  }, [watchlist]);

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
    updateItemInWatchlist
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
