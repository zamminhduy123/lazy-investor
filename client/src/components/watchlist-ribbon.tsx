import { useRef } from "react";
import { Stock } from "@/lib/mock-data";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WatchlistRibbonProps {
  stocks: Stock[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string | null) => void;
}

export function WatchlistRibbon({ stocks, selectedSymbol, onSelectSymbol }: WatchlistRibbonProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="w-full relative group">
      {/* Fade gradients for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 pt-1 px-1 gap-3 scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <motion.div 
          onClick={() => onSelectSymbol(null)}
          className={cn(
            "min-w-[100px] flex flex-col justify-center items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 snap-start",
            selectedSymbol === null 
              ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105" 
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
          )}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider">Market</span>
          <span className="font-bold text-sm">All</span>
        </motion.div>

        {stocks.map((stock) => {
          const isUp = stock.change > 0;
          const isDown = stock.change < 0;
          const isSelected = selectedSymbol === stock.symbol;

          return (
            <motion.div
              key={stock.symbol}
              onClick={() => onSelectSymbol(isSelected ? null : stock.symbol)}
              className={cn(
                "min-w-[140px] p-3 rounded-xl border cursor-pointer transition-all duration-200 snap-start bg-white flex flex-col justify-between h-[84px]",
                isSelected 
                  ? "ring-2 ring-slate-900 border-slate-900 shadow-md z-10" 
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              data-testid={`stock-card-${stock.symbol}`}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "font-bold text-base tracking-tight",
                  isSelected ? "text-slate-900" : "text-slate-700"
                )}>
                  {stock.symbol}
                </span>
                <div className={cn(
                  "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full",
                  isUp ? "bg-emerald-50 text-emerald-700" : 
                  isDown ? "bg-rose-50 text-rose-700" : 
                  "bg-slate-100 text-slate-600"
                )}>
                  {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : 
                   isDown ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : 
                   <Minus className="w-3 h-3 mr-0.5" />}
                  {Math.abs(stock.changePercent).toFixed(2)}%
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="text-lg font-mono font-medium text-slate-900 tracking-tighter leading-none">
                  {formatCurrency(stock.price)}
                </div>
                <div className={cn(
                  "text-[10px] font-medium mt-1",
                  isUp ? "text-emerald-600" : 
                  isDown ? "text-rose-600" : 
                  "text-slate-400"
                )}>
                  {stock.change > 0 ? "+" : ""}{formatCurrency(stock.change)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
