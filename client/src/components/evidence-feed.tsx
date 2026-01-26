import { Clock, ExternalLink, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsListItem } from "@/store";
import { cn } from "@/lib/utils";
interface EvidenceFeedProps {
  news: NewsListItem[];
  selectedSymbol: string | null;
}

export function EvidenceFeed({ news, selectedSymbol }: EvidenceFeedProps) {
  const filteredNews = selectedSymbol 
    ? news.filter(item => item.relatedSymbols?.includes(selectedSymbol))
    : news;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
          <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mr-2 animate-pulse"></span>
          Evidence Feed
          {selectedSymbol && <span className="ml-2 text-slate-400 font-normal">/ {selectedSymbol}</span>}
        </h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {filteredNews.length} Records
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[85vh] overflow-y-auto">
        {filteredNews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No specific news found for {selectedSymbol} today.
          </div>
        ) : (
          filteredNews.map((item) => (
            <div 
              key={item.id} 
              className="group p-4 hover:bg-slate-50/50 transition-colors cursor-pointer flex gap-5"
            >
              {item.imageUrl && (
                <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-xl border border-slate-100">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors" />
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-center py-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.source}
                  </span>
                  <span className="text-[10px] text-slate-300">/</span>
                  <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {/* <Clock className="w-3 h-3 mr-1" /> */}
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('vi') : 'Unknown Date'}
                  </span>
                </div>
                
                <h4 className="text-base font-bold text-slate-900 group-hover:text-slate-900 transition-colors leading-snug mb-3">
                  {item.title}
                </h4>

                {(item.refPrice || item.priceChangePct) && (
                  <div className="flex items-center gap-4 mt-auto">
                    {item.refPrice && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Ref Price</span>
                        <span className="text-xs font-mono font-bold text-slate-600">{item.refPrice.toLocaleString()}₫</span>
                      </div>
                    )}
                    {item.priceChangePct !== undefined && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Impact</span>
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-mono font-bold",
                          item.priceChangePct >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {item.priceChangePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {item.priceChangePct >= 0 ? '+' : ''}{item.priceChangePct}%
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
              </div>
            </div>
          ))
          )}
      </div>
      <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
          View Archive
        </button>
      </div>
    </div>
  );
}
