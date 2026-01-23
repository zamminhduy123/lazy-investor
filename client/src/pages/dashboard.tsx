import { WatchlistRibbon } from "@/components/watchlist-ribbon";
import { AIBriefingCard } from "@/components/ai-briefing-card";
import { EvidenceFeed } from "@/components/evidence-feed";
import { Stock } from "@/lib/mock-data";
import { useStockStore, useNewsStore } from "@/store";
import { usePriceBoard } from "@/hooks/useStocks";
import { useEffect, useMemo } from "react";

export default function Dashboard() {
  const {
    watchlist,
    selectedSymbol,
    setSelectedSymbol,
    addToWatchlist,
    removeFromWatchlist,
  } = useStockStore();

  const { fetchNewsForSymbols, getNewsForSymbols } = useNewsStore();

  // Fetch price board data for watchlist symbols to keep data fresh
  usePriceBoard(
    watchlist.map((s) => s.symbol),
    watchlist.length > 0
  );

  const handleAddStock = (stock: Stock) => {
    addToWatchlist(stock);
  };

  const handleRemoveStock = (symbol: string) => {
    removeFromWatchlist(symbol);
  };

  useEffect(() => {
    const symbols = watchlist.map((s) => s.symbol);
    fetchNewsForSymbols(symbols, { limit: 5 });
  }, [watchlist, fetchNewsForSymbols]);

  const feedNews = useMemo(() => {
    const symbols = watchlist.map((s) => s.symbol);
    return getNewsForSymbols(symbols);
  }, [watchlist, getNewsForSymbols]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar: Watchlist */}
      <aside className="w-64 shrink-0 flex flex-col h-full">
        <WatchlistRibbon 
          stocks={watchlist} 
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
          onRemoveStock={handleRemoveStock}
          onAddStock={handleAddStock}
        />
      </aside>

      {/* Main Content Area: Intelligence & News */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Lazy Investor</h1>
              <p className="text-sm text-slate-500">Market Insight • Vietnamese Stock Market</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-1 rounded">VN-INDEX</span>
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
              </div>
            </div>
          </header>

          {/* Intelligence Center */}
          <section>
            <AIBriefingCard selectedSymbol={selectedSymbol} />
          </section>

          {/* Evidence Feed */}
          <section>
            <EvidenceFeed 
              news={feedNews} 
              selectedSymbol={selectedSymbol}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
