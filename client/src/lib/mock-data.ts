import { Stock } from "@/store";

export interface ArticleAnalysis {
  is_relevant: boolean;
  relevance_reason: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  tldr: string;
  rationale: string;
  key_drivers: string[];
  risks_or_caveats: string[];
  score: number;
  confidence: number;
}

export interface Article {
  title: string;
  link: string;
  pubDate: string;
  analysis: ArticleAnalysis;
}

export interface DetailedAnalysis {
  symbol: string;
  market_context: string;
  articles: Article[];
  overall_summary: {
    summary: string;
    market_sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    trend_analysis: string;
    confidence_score: number;
  };
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
  { symbol: "HPG", name: "Hoa Phat Group", price: 26900, change: -200, changePercent: -0.74, volume: "12.5M" },
  { symbol: "FPT", name: "FPT Corporation", price: 96200, change: 1200, changePercent: 1.26, volume: "1.2M" },
  { symbol: "MWG", name: "Mobile World Inv.", price: 46800, change: -500, changePercent: -1.06, volume: "3.4M" },
  { symbol: "VCB", name: "Vietcombank", price: 89500, change: 100, changePercent: 0.11, volume: "800K" },
  { symbol: "MSN", name: "Masan Group", price: 68100, change: -1200, changePercent: -1.73, volume: "1.1M" },
];

export const DETAILED_ANALYSIS_HPG: DetailedAnalysis = {
  "symbol": "HPG",
  "market_context": "Stock Price Today: 26.9 (Change: -0.74%)",
  "articles": [
    {
      "title": "Hòa Phát (HPG) nộp ngân sách 13.000 tỷ đồng",
      "link": "https://www.tinnhanhchungkhoan.vn/hoa-phat-hpg-nop-ngan-sach-13000-ty-dong-post383686.html",
      "pubDate": "2026-01-23 13:42:19.231480",
      "analysis": {
        "is_relevant": false,
        "relevance_reason": "Tin chỉ báo cáo số thuế nộp cao (hậu quả của lợi nhuận), không tiết lộ doanh thu/lợi nhuận mới hay guidance, không tác động trực tiếp đến giá cổ phiếu.",
        "sentiment": "Neutral",
        "tldr": "Tập đoàn Hòa Phát nộp 13.000 tỷ đồng ngân sách năm 2025 tại 20 tỉnh thành, với Dung Quất và Hải Dương dẫn đầu.",
        "rationale": "Nộp thuế cao chứng tỏ lợi nhuận khủng thật, nhưng giờ công bố thì ai chả biết, giá HPG đang đỏ sàn thì tin này có cứu nổi? Chỉ là báo cáo quá khứ, nhà đầu tư cần số liệu tài chính cụ thể mới tin.",
        "key_drivers": [
          "Nộp 13.000 tỷ đồng ngân sách năm 2025",
          "Dung Quất đóng góp 8.237 tỷ",
          "Hải Dương tăng 48% lên 2.034 tỷ",
          "Tổng lũy kế 101.000 tỷ từ 2007",
          "Top 4 doanh nghiệp tư nhân nộp thuế nhiều nhất"
        ],
        "risks_or_caveats": [
          "Nộp thuế cao ngụ ý lợi nhuận trước thuế lớn, nhưng không có số liệu doanh thu cụ thể",
          "Tin cũ, thị trường đã phản ánh",
          "Giá HPG đang giảm 0.74% hôm nay"
        ],
        "score": 2,
        "confidence": 0.95
      }
    },
    {
      "title": "Hòa Phát (HPG) lập kỷ lục vượt 10 triệu tấn thép trong năm 2025, tăng 31% so với 2024",
      "link": "https://www.tinnhanhchungkhoan.vn/hoa-phat-hpg-lap-ky-luc-vuot-10-trieu-tan-thep-trong-nam-2025-tang-31-so-voi-2024-post383465.html",
      "pubDate": "2026-01-23 13:42:19.231900",
      "analysis": {
        "is_relevant": true,
        "relevance_reason": "Tin báo cáo kỷ lục sản lượng thép 10.6 triệu tấn năm 2025, tăng 31% so với 2024, trực tiếp tác động tích cực đến doanh thu và lợi nhuận HPG.",
        "sentiment": "Bullish",
        "tldr": "Hòa Phát (HPG) lập kỷ lục sản xuất 11 triệu tấn thép thô và bán 10.6 triệu tấn các sản phẩm thép chính trong năm 2025, tăng mạnh so với 2024.",
        "rationale": "Sản lượng vọt lên kỷ lục nghe thì ngon lành, chứng tỏ Dung Quất 2 chạy tốt, thị phần số 1 vững chãi. Nhưng giá cổ phiếu đang đỏ sàn thì liệu có phải 'tin vui muộn' hay thị trường đã đánh giá hết rồi?",
        "key_drivers": [
          "Sản lượng bán thép chính đạt 10.6 triệu tấn, +31% YoY",
          "HRC tăng 73% lên 5 triệu tấn, chiếm 60% thị phần VN",
          "Thép xây dựng 4.8 triệu tấn, giữ 36% thị phần số 1",
          "Dây chuyền HRC2 Dung Quất bổ sung mạnh từ Q4"
        ],
        "risks_or_caveats": [
          "Giá thép biến động khó lường",
          "Nhu cầu xây dựng chưa bùng nổ mạnh",
          "Chi phí nguyên liệu có thể tăng"
        ],
        "score": 8,
        "confidence": 0.95
      }
    }
  ],
  "overall_summary": {
    "summary": "Tập đoàn Hòa Phát (HPG) ghi nhận năm 2025 thành công vượt bậc với sản lượng thép thô đạt 11 triệu tấn, tăng 26% và bán 10,6 triệu tấn sản phẩm thép chính, tăng 31% so với 2024, lập kỷ lục lịch sử. Các dự án đầu tư chiến lược như ray cao tốc và KCN đang mở rộng hệ sinh thái.",
    "market_sentiment": "Bullish",
    "trend_analysis": "Xu hướng tăng trưởng mạnh mẽ nhờ mở rộng sản xuất, chinh phục kỷ lục công suất, các dự án đầu tư chiến lược hạ tầng và củng cố thị phần nội địa trước nhập khẩu giảm.",
    "confidence_score": 10
  }
};

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
