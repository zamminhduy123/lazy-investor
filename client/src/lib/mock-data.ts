export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  relatedSymbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export const MOCK_STOCKS: Stock[] = [
  { symbol: "HPG", name: "Hoa Phat Group", price: 28400, change: 450, changePercent: 1.61, volume: "12.5M" },
  { symbol: "FPT", name: "FPT Corporation", price: 96200, change: 1200, changePercent: 1.26, volume: "1.2M" },
  { symbol: "MWG", name: "Mobile World Inv.", price: 46800, change: -500, changePercent: -1.06, volume: "3.4M" },
  { symbol: "VCB", name: "Vietcombank", price: 89500, change: 100, changePercent: 0.11, volume: "800K" },
  { symbol: "MSN", name: "Masan Group", price: 68100, change: -1200, changePercent: -1.73, volume: "1.1M" },
  { symbol: "VNM", name: "Vinamilk", price: 67300, change: 200, changePercent: 0.30, volume: "2.1M" },
  { symbol: "SSI", name: "SSI Securities", price: 34150, change: 850, changePercent: 2.55, volume: "15.6M" },
];

export const MOCK_NEWS: NewsItem[] = [
  { 
    id: "1", 
    title: "HPG reports record steel output in Q4, driven by domestic infrastructure demand.", 
    source: "VietStock", 
    timeAgo: "2h ago", 
    relatedSymbols: ["HPG"],
    sentiment: 'positive'
  },
  { 
    id: "2", 
    title: "Foreign investors net sell MWG for the 5th consecutive session amid retail slowdown fears.", 
    source: "CafeF", 
    timeAgo: "3h ago", 
    relatedSymbols: ["MWG"],
    sentiment: 'negative'
  },
  { 
    id: "3", 
    title: "FPT signs strategic AI partnership with major US tech firm, targeting global expansion.", 
    source: "VnExpress International", 
    timeAgo: "4h ago", 
    relatedSymbols: ["FPT"],
    sentiment: 'positive'
  },
  { 
    id: "4", 
    title: "Vietnam's GDP growth forecast raised to 6.5% for 2026 by World Bank.", 
    source: "Bloomberg", 
    timeAgo: "5h ago", 
    relatedSymbols: ["VCB", "MSN", "HPG"],
    sentiment: 'positive'
  },
  { 
    id: "5", 
    title: "Masan Group (MSN) restructures consumer holdings, stock dips slightly.", 
    source: "Reuters", 
    timeAgo: "6h ago", 
    relatedSymbols: ["MSN"],
    sentiment: 'neutral'
  },
  { 
    id: "6", 
    title: "SSI sees surge in new trading accounts opened in January.", 
    source: "Dau Tu Chung Khoan", 
    timeAgo: "7h ago", 
    relatedSymbols: ["SSI"],
    sentiment: 'positive'
  }
];

export const AI_BRIEFING_MOCK = {
  headline: "Industrial & Tech Sectors Lead Market Rally",
  sentiment: "bullish",
  takeaways: [
    "Steel sector shows strong momentum with HPG leading volume, supported by public investment disbursement news.",
    "Retail remains under pressure; MWG facing foreign outflows despite broader market optimism.",
    "FPT continues to attract institutional interest following new AI strategic deals.",
    "Banking sector (VCB) remains stable, acting as a market pillar amid slight volatility."
  ]
};
