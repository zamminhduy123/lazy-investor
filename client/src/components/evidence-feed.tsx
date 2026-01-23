import { useMemo } from "react";
import type { NewsItem } from "@/lib/mock-data";
import { Clock, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type EvidenceFeedItem = {
  id: string;
  title: string;
  source: string;
  timeAgo?: string;
  publishedAt?: string;
  url?: string;
  relatedSymbols?: string[];
  sentiment?: "positive" | "negative" | "neutral";
};

interface EvidenceFeedProps {
  /**
   * Accepts mock NewsItem[] OR server-shaped items that at least have:
   * { id, title, source, (timeAgo|publishedAt), (url), (relatedSymbols) }
   */
  news: Array<NewsItem | EvidenceFeedItem>;
  selectedSymbol: string | null;
}

function asEvidenceItem(item: NewsItem | EvidenceFeedItem): EvidenceFeedItem {
  // Mock data already matches most fields
  const anyItem = item as any;

  return {
    id: String(anyItem.id ?? anyItem.link ?? anyItem.url ?? anyItem.title),
    title: String(anyItem.title ?? ""),
    source: String(anyItem.source ?? anyItem.provider ?? "News"),
    timeAgo: anyItem.timeAgo,
    publishedAt: anyItem.published_at ?? anyItem.publishedAt ?? anyItem.pubDate,
    url: anyItem.url ?? anyItem.link,
    relatedSymbols: Array.isArray(anyItem.relatedSymbols)
      ? anyItem.relatedSymbols
      : Array.isArray(anyItem.related_symbols)
        ? anyItem.related_symbols
        : Array.isArray(anyItem.symbols)
          ? anyItem.symbols
          : [],
    sentiment: anyItem.sentiment,
  };
}

function toTimeAgo(input?: string): string | undefined {
  if (!input) return undefined;
  // If it's already formatted like "2h ago", keep it
  if (input.includes("ago")) return input;

  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;

  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function EvidenceFeed({ news, selectedSymbol }: EvidenceFeedProps) {
  const normalized = useMemo(() => news.map(asEvidenceItem), [news]);

  const filteredNews = useMemo(() => {
    if (!selectedSymbol) return normalized;
    return normalized.filter((item) => (item.relatedSymbols ?? []).includes(selectedSymbol));
  }, [normalized, selectedSymbol]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center">
          <span className="w-2 h-2 bg-slate-900 rounded-full mr-2 animate-pulse"></span>
          Evidence Feed
          {selectedSymbol && (
            <span className="ml-2 text-slate-400 font-normal">for {selectedSymbol}</span>
          )}
        </h3>
        <span className="text-xs text-slate-400 font-medium">{filteredNews.length} Updates</span>
      </div>

      <div className="divide-y divide-slate-100">
        {filteredNews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No specific news found for {selectedSymbol} today.
          </div>
        ) : (
          filteredNews.map((item) => {
            const timeLabel = item.timeAgo ?? toTimeAgo(item.publishedAt) ?? "";

            return (
              <div
                key={item.id}
                className="group p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4"
                onClick={() => {
                  if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
                }}
                role={item.url ? "link" : undefined}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {item.source}
                    </span>

                    {timeLabel ? (
                      <>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="flex items-center text-[10px] text-slate-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {timeLabel}
                        </span>
                      </>
                    ) : null}

                    {(item.relatedSymbols?.length ?? 0) > 0 && !selectedSymbol && (
                      <>
                        <span className="text-[10px] text-slate-300">•</span>
                        <div className="flex gap-1">
                          {item.relatedSymbols!.map((sym) => (
                            <span
                              key={sym}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 rounded-sm"
                            >
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-slate-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!item.url}
                    aria-label="Open article"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-slate-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!item.url}
                    aria-label="Open details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
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