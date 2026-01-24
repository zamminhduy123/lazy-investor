import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, Minus, Plus, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { stocksApi, SymbolsApiResponse } from "@/api";
import { Stock, StockSymbol } from "@/store";

interface WatchlistRibbonProps {
  stocks: Stock[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string | null) => void;
  onRemoveStock: (symbol: string) => void;
  onAddStock: (stock: Stock) => void;
}

export function WatchlistRibbon({ stocks, selectedSymbol, onSelectSymbol, onRemoveStock, onAddStock }: WatchlistRibbonProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const symbolsQuery = useQuery<SymbolsApiResponse>({
    queryKey: stocksApi.queryKeys.symbols(),
    queryFn: () => stocksApi.getAllSymbols() as Promise<SymbolsApiResponse>,
    staleTime: 1000 * 60 * 60, // 1h
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleAddStock = (stock: StockSymbol) => {
    // Convert StockSymbol to Stock before adding
    const stockToAdd: Stock = {
      symbol: stock.symbol,
      name: stock.organ_short_name,
      price: 0, // Default or fetch actual priceribb
      change: 0,
      changePercent: 0,
      volume: 0,
    };
    // fetch stock /stock-info"
    stocksApi.getStockInfo([stock.symbol]).then((res : any) => {
      if (res.data) {
        const entry = res.data[0];
        stockToAdd.price = entry.close;
        stockToAdd.change = entry.change;
        stockToAdd.changePercent = entry.change_percentage;
        stockToAdd.volume = entry.volume.toString();
      }

      onAddStock(stockToAdd);
    }).catch(() => {
      onAddStock(stockToAdd);
    });

    // Close dialog and reset search
    setIsAddOpen(false);
    setSearchQuery("");
  };

  const handleRemoveStock = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    onRemoveStock(symbol);
  };

  // You may need to adjust this mapping based on server response shape
  const allStocks: StockSymbol[] = useMemo(() => {
    const raw = symbolsQuery.data
    if (!raw) return [];
    return (Array.isArray(raw.data) ? raw.data : []).map((s) => ({
      symbol: s.symbol,
      exchange: s.comGroupCode,
      type: "", // Type info not provided in SymbolsApiResponse
      organ_short_name: s.organName,
      organ_name: s.organName,
      product_grp_id: "",
    }));
  }, [symbolsQuery.data]);

  const availableToAdd = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allStocks.filter(
      (s) =>
        !stocks.some((ws) => ws.symbol === s.symbol) &&
        (q.length === 0 ||
          s.symbol?.toLowerCase().includes(q) ||
          s.organ_short_name?.toLowerCase().includes(q))
    );
  }, [allStocks, stocks, searchQuery]);

  // Infinite scroll state
  const [visibleCount, setVisibleCount] = useState(20);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset limit when search or dialog changes
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, isAddOpen]);

  // 1. Store observer instance in a ref so it persists across renders
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 2. Use a Callback Ref instead of a normal useRef + useEffect
  // This function is called automatically by React when the sentinel <div> mounts or unmounts
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // If previous observer exists, disconnect it
      if (observerRef.current) observerRef.current.disconnect();

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setVisibleCount((prev) => prev + 20);
          }
        },
        { threshold: 0.1, rootMargin: "100px" }
      );

      // Start observing the new node
      observerRef.current.observe(node);
    } else {
      // Node unmounted (or became null), clean up
      if (observerRef.current) observerRef.current.disconnect();
    }
  }, []); // purely functional, no deps needed

  // Slice the data for display
  const visibleStocks = useMemo(() => 
    availableToAdd.slice(0, visibleCount), 
    [availableToAdd, visibleCount]
  );

  return (
    <div className="w-full flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Watchlist</h2>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle>Add to Watchlist</DialogTitle>
            </DialogHeader>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search symbol or company..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
<div className="mt-4 max-h-75 overflow-y-auto space-y-1 pr-1">
              {visibleStocks.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-500">No more stocks available to add.</p>
              ) : (
                <>
                  {visibleStocks.map((symbol) => (
                    <button
                      key={symbol.symbol}
                      onClick={() => handleAddStock(symbol)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{symbol.symbol}</div>
                        <div className="text-xs text-slate-500">{symbol.organ_short_name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <div className="font-mono">{symbol.exchange}</div>
                        </div>
                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </button>
                  ))}
                  
                  {/* Sentinel element for infinite scroll */}
                  {visibleStocks.length < availableToAdd.length && (
                    <div ref={loadMoreRef} className="py-2 text-center text-xs text-slate-300">
                      Loading...
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200"
      >
        <motion.div 
          onClick={() => onSelectSymbol(null)}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200",
            selectedSymbol === null 
              ? "bg-slate-900 border-slate-900 text-white shadow-md" 
              : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
          )}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="font-bold text-sm uppercase">Market Overview</span>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {stocks.map((stock) => {
            const isUp = stock.change > 0;
            const isDown = stock.change < 0;
            const isSelected = selectedSymbol === stock.symbol;

            return (
              <motion.div
                key={stock.symbol}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => onSelectSymbol(isSelected ? null : stock.symbol)}
                className={cn(
                  "w-full p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group relative",
                  isSelected 
                    ? "bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                )}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                data-testid={`stock-card-${stock.symbol}`}
              >
                <div className="flex flex-col">
                  <span className={cn(
                    "font-bold text-sm tracking-tight",
                    isSelected ? "text-slate-900" : "text-slate-700"
                  )}>
                    {stock.symbol}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-20">
                    {stock.name}
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-sm font-mono font-bold text-slate-900">
                    {formatCurrency(stock.price)}
                  </div>
                  <div className={cn(
                    "flex items-center text-[10px] font-bold",
                    isUp ? "text-emerald-600" : 
                    isDown ? "text-rose-600" : 
                    "text-slate-400"
                  )}>
                    {isUp ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : 
                     isDown ? <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" /> : 
                     <Minus className="w-2.5 h-2.5 mr-0.5" />}
                    {Math.abs(stock.changePercent).toFixed(2)}%
                  </div>
                </div>

                <button
                  onClick={(e) => handleRemoveStock(e, stock.symbol)}
                  className="absolute -right-1 -top-1 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600 shadow-sm z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
