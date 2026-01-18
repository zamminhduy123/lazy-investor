import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { WatchlistRibbon } from "@/components/watchlist-ribbon";
import { AIBriefingCard } from "@/components/ai-briefing-card";
import { EvidenceFeed } from "@/components/evidence-feed";
import { MOCK_STOCKS, MOCK_NEWS } from "@/lib/mock-data";

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Top Section: Market Pulse */}
        <section>
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Your Watchlist
            </h2>
            <span className="text-xs text-slate-400">Updated 2m ago</span>
          </div>
          <WatchlistRibbon 
            stocks={MOCK_STOCKS} 
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
          />
        </section>

        {/* Middle Section: Intelligence Center */}
        <section>
          <AIBriefingCard selectedSymbol={selectedSymbol} />
        </section>

        {/* Bottom Section: Evidence Feed */}
        <section>
          <EvidenceFeed 
            news={MOCK_NEWS} 
            selectedSymbol={selectedSymbol}
          />
        </section>

      </div>
    </DashboardLayout>
  );
}
