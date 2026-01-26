import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";
import { newsApi } from "@/api/news";
import { ServerNews } from "@/api";

export type NewsSource = "vci" | "google" | "auto";

/** Lightweight item (NO article body) */
export type NewsListItem = {
  id: string;
  title: string;
  url?: string;
  source: string;
  publishedAt?: string;
  imageUrl: string;
  relatedSymbols: string[];
  priceChangePct?: number;
  refPrice?: number;
};

type NewsBySymbol = Record<string, NewsListItem[]>;

interface NewsStoreContextValue {
  // UI state
  source: NewsSource;
  setSource: (s: NewsSource) => void;

  selectedArticleUrl: string | null;
  setSelectedArticleUrl: (url: string | null) => void;

  // Cached list state
  newsBySymbol: NewsBySymbol;
  setNewsForSymbol: (symbol: string, items: NewsListItem[]) => void;
  getNewsForSymbols: (symbols: string[]) => NewsListItem[];

  // Networking
  fetchNewsForSymbols: (symbols: string[], opts?: { limit?: number }) => Promise<void>;
}

const NewsStoreContext = createContext<NewsStoreContextValue | undefined>(undefined);

function normalizeServerNews(symbol: string, raw: ServerNews[]): NewsListItem[] {
  return raw.map((it) => {
      const url = it.link;
      const title = it.title ?? it.news_title ?? "";
      const publishedAt = it.public_date

      return {
        id: String(it.id ?? url ?? `${symbol}:${title}:${publishedAt ?? ""}`),
        title: String(title),
        url: url ? String(url) : undefined,
        source: String(it.source ?? "vnstock"),
        publishedAt: publishedAt ? String(publishedAt) : undefined,
        relatedSymbols: [symbol],
        imageUrl: String(it.news_image_url ?? ""),
        priceChangePct: typeof it.price_change_pct === "number" ? it.price_change_pct : undefined,
        refPrice: typeof it.ref_price === "number" ? it.ref_price : undefined,
      } satisfies NewsListItem;
    })
    .filter((x) => x.title.length > 0);
}

export function NewsStoreProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<NewsSource>("auto");
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(null);
  const [newsBySymbol, setNewsBySymbol] = useState<NewsBySymbol>({});

  const setNewsForSymbol = useCallback((symbol: string, items: NewsListItem[]) => {
    setNewsBySymbol((prev) => ({ ...prev, [symbol]: items }));
  }, []);

  const getNewsForSymbols = useCallback(
    (symbols: string[]) => {
      const out: NewsListItem[] = [];
      for (const s of symbols) {
        const list = newsBySymbol[s];
        if (Array.isArray(list)) out.push(...list);
      }
      // newest first
      out.sort((a, b) => {
        const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bt - at;
      });
      return out;
    },
    [newsBySymbol]
  );

  const fetchNewsForSymbols = useCallback(
    async (symbols: string[], opts?: { limit?: number }) => {
      const uniq = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)));
      console.log("Fetching news for symbols:", uniq);
      if (uniq.length === 0) return;

      // Only keep VNStock items as you requested: source="vci" and no google fallback
      await Promise.all(
        uniq.map(async (sym) => {
          const raw = await newsApi.getCompanyNews(sym, {
            limit: opts?.limit ?? 10,
            source: "VCI",
            fallback: false,
          });
          console.log(`Fetched news for ${sym}:`, raw);
          const normalized = normalizeServerNews(sym, raw?.data);
          setNewsForSymbol(sym, normalized);
        })
      );
    },
    [setNewsForSymbol]
  );

  const value = useMemo(
    () => ({
      source,
      setSource,
      selectedArticleUrl,
      setSelectedArticleUrl,
      newsBySymbol,
      setNewsForSymbol,
      getNewsForSymbols,
      fetchNewsForSymbols,
    }),
    [
      source,
      selectedArticleUrl,
      newsBySymbol,
      setNewsForSymbol,
      getNewsForSymbols,
      fetchNewsForSymbols,
    ]
  );

  return <NewsStoreContext.Provider value={value}>{children}</NewsStoreContext.Provider>;
}

export function useNewsStore() {
  const ctx = useContext(NewsStoreContext);
  if (!ctx) throw new Error("useNewsStore must be used within a NewsStoreProvider");
  return ctx;
}