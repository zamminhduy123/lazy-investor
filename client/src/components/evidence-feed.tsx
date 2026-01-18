import { NewsItem } from "@/lib/mock-data";
import { Clock, ExternalLink, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EvidenceFeedProps {
  news: NewsItem[];
  selectedSymbol: string | null;
}

export function EvidenceFeed({ news, selectedSymbol }: EvidenceFeedProps) {
  const filteredNews = selectedSymbol 
    ? news.filter(item => item.relatedSymbols.includes(selectedSymbol))
    : news;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center">
          <span className="w-2 h-2 bg-slate-900 rounded-full mr-2 animate-pulse"></span>
          Evidence Feed
          {selectedSymbol && <span className="ml-2 text-slate-400 font-normal">for {selectedSymbol}</span>}
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          {filteredNews.length} Updates
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {filteredNews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No specific news found for {selectedSymbol} today.
          </div>
        ) : (
          filteredNews.map((item) => (
            <div 
              key={item.id} 
              className="group p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.source}
                  </span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="flex items-center text-[10px] text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.timeAgo}
                  </span>
                  {item.relatedSymbols.length > 0 && !selectedSymbol && (
                    <>
                      <span className="text-[10px] text-slate-300">•</span>
                      <div className="flex gap-1">
                        {item.relatedSymbols.map(sym => (
                          <span key={sym} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 rounded-sm">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <h4 className="text-base font-medium text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                  {item.title}
                </h4>
              </div>
              
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
        <button className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
          View All Market News
        </button>
      </div>
    </div>
  );
}
