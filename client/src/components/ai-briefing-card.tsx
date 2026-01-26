import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  ShieldAlert, 
  Target,
  Calendar,
  Filter,
  BarChart3,
  Newspaper,
  LayoutDashboard,
  History,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStockAnalysis } from "@/api/analyse";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvidenceFeed } from "./evidence-feed";
import { useNewsStore } from "@/store";
import { useDividendHistory, useStockPerformance } from "@/hooks";
interface AIBriefingCardProps {
  selectedSymbol: string | null;
}

export function AIBriefingCard({ selectedSymbol }: AIBriefingCardProps) {
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [dateRange, setDateRange] = useState("today");
  
  const { getNewsForSymbols } = useNewsStore();
  
  // Use the hook with the selected symbol
  const { data, refetch, isFetching } = useStockAnalysis(selectedSymbol || "");

  const handleGenerate = () => {
    refetch()
  };
  const { data: performanceData }= useStockPerformance(selectedSymbol || "");

  const { data: dividendHistory }= useDividendHistory(selectedSymbol || "");

  const currentAnalysis = data || null;

  const getSentimentStyles = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === 'bullish') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (s === 'bearish') return 'text-rose-600 bg-rose-50 border-rose-100';
    return 'text-amber-600 bg-amber-50 border-amber-100';
  };

  const getSentimentIcon = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === 'bullish') return <TrendingUp className="w-4 h-4 mr-1" />;
    if (s === 'bearish') return <TrendingDown className="w-4 h-4 mr-1" />;
    return <Minus className="w-4 h-4 mr-1" />;
  };
  
  let show = 1
  if (isFetching) {
    if (data) {
      show = 3
    } else {
      show = 2
    }
  } else if (data) {
    show = 3
  }

  return (
    <div className="w-full my-6">
      {/* Tool Box Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['today', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  dateRange === range 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="h-4 w-[1px] bg-slate-200 mx-1" />
          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <Filter className="w-3 h-3 mr-2" /> Filter
          </Button>
        </div>
        
        {selectedSymbol && (
          <div className="flex items-center gap-3 pr-2">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Performance</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <span className={cn("text-[10px] font-mono font-bold", String(performanceData?.["1W"]).includes('-') ? "text-rose-600" : "text-emerald-600")}>{performanceData?.["1W"]} (W)</span>
                   <span className={cn("text-[10px] font-mono font-bold", String(performanceData?.["1M"]).includes('-') ? "text-rose-600" : "text-emerald-600")}>{performanceData?.["1M"]} (M)</span>
                </div>
             </div>
             <History className="w-4 h-4 text-slate-300" />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {show == 1 && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-size:[16px_16px] opacity-30" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm mx-auto group-hover:scale-105 transition-transform duration-500">
                <Sparkles className="w-8 h-8 text-slate-400 group-hover:text-yellow-500 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                Deep Dive Analysis
              </h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                {selectedSymbol 
                  ? `Perform a comprehensive AI evaluation of ${selectedSymbol} based on latest regulatory filings and news.` 
                  : "Select a stock to generate a premium executive market briefing."}
              </p>
              <Button 
                onClick={handleGenerate}
                disabled={!selectedSymbol}
                size="lg" 
                className="bg-slate-900 hover:bg-slate-800 text-white px-10 rounded-full shadow-xl transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {selectedSymbol} Intelligence
              </Button>
            </div>
          </motion.div>
        )}

        {show == 2 && (
          <motion.div
            key="analyzing"
            className="w-full h-[400px] bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-slate-900 rounded-full animate-ping opacity-10" />
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Synthesizing Reports</h4>
            <p className="text-slate-400 font-mono text-sm">Evaluating relevance & sentiment...</p>
          </motion.div>
        )}

        {show == 3 && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <TabsList className="bg-transparent gap-1">
                  <TabsTrigger value="summary" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg text-xs font-bold uppercase tracking-widest h-9">
                    <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Summary
                  </TabsTrigger>
                  <TabsTrigger value="deepdive" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg text-xs font-bold uppercase tracking-widest h-9">
                    <BarChart3 className="w-3.5 h-3.5 mr-2" /> Deep Dive
                  </TabsTrigger>
                  <TabsTrigger value="evidence" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg text-xs font-bold uppercase tracking-widest h-9">
                    <Newspaper className="w-3.5 h-3.5 mr-2" /> Evidence
                  </TabsTrigger>
                  <TabsTrigger value="dividends" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg text-xs font-bold uppercase tracking-widest h-9">
                    <Coins className="w-3.5 h-3.5 mr-2" /> Dividends
                  </TabsTrigger>
                </TabsList>
                  <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8 text-slate-400 hover:text-slate-600 mr-1">
                    <History className="w-4 h-4" />
                  </Button>
              </div>

              <TabsContent value="summary" className="mt-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="p-1 h-1 bg-linear-to-r from-slate-900 via-slate-700 to-slate-900" />
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Badge variant="outline" className="rounded-md bg-slate-50 text-slate-500 border-slate-100 font-mono text-[10px]">
                        CONFIDENCE: {currentAnalysis?.overall_summary?.confidence_score || 0}/10
                      </Badge>
                      <span className={cn("text-xs font-bold px-3 py-1 rounded-full border flex items-center", getSentimentStyles(currentAnalysis?.overall_summary?.market_sentiment || ''))}>
                        {getSentimentIcon(currentAnalysis?.overall_summary?.market_sentiment || '')}
                        {(currentAnalysis?.overall_summary?.market_sentiment || '').toUpperCase()}
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                      {currentAnalysis?.overall_summary?.market_sentiment === 'Bullish' ? 'Strategic Growth Outlook' : 'Market Narrative'}
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-lg mb-8">
                      {currentAnalysis?.overall_summary?.summary || "No summary available at this time."}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                          <Target className="w-3 h-3 mr-2" /> Trend Analysis
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {currentAnalysis?.overall_summary?.trend_analysis || "No trend analysis available."}
                        </p>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white shadow-lg">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                          <History className="w-3 h-3 mr-2 text-emerald-400" /> Recent Momentum
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                             <span className="text-xs text-slate-400">Past Week (1W)</span>
                             <span className={cn("text-xs font-mono font-bold", String(performanceData?.["1W"]).includes('-') ? "text-rose-400" : "text-emerald-400")}>
                               {performanceData?.["1W"] || "N/A"}
                             </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                             <span className="text-xs text-slate-400">Past Month (1M)</span>
                             <span className={cn("text-xs font-mono font-bold", String(performanceData?.["1M"]).includes('-') ? "text-rose-400" : "text-emerald-400")}>
                               {performanceData?.["1M"] || "N/A"}
                             </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                             <span className="text-xs text-slate-400">Past Quarter (3M)</span>
                             <span className={cn("text-xs font-mono font-bold", String(performanceData?.["3M"]).includes('-') ? "text-rose-400" : "text-emerald-400")}>
                               {performanceData?.["3M"] || "N/A"}
                             </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                             <span className="text-xs text-slate-400">Past 6 Months (6M)</span>
                             <span className={cn("text-xs font-mono font-bold", String(performanceData?.["6M"]).includes('-') ? "text-rose-400" : "text-emerald-400")}>
                               {performanceData?.["6M"] || "N/A"}
                             </span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Past Year (1Y)</span>
                             <span className={cn("text-xs font-mono font-bold", String(performanceData?.["1Y"]).includes('-') ? "text-rose-400" : "text-emerald-400")}>
                               {performanceData?.["1Y"] || "N/A"}
                             </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="deepdive" className="mt-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {currentAnalysis ? (
                    currentAnalysis.articles.map((article, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all">
                        <button 
                          onClick={() => setExpandedArticle(expandedArticle === idx ? null : idx)}
                          className="w-full p-4 flex items-center justify-between text-left group"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              article.analysis?.sentiment === 'Bullish' ? "bg-emerald-500" :
                              article.analysis?.sentiment === 'Bearish' ? "bg-rose-500" : "bg-slate-300"
                            )} />
                            <span className="text-sm font-bold text-slate-900 truncate pr-4">
                              {article.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">
                              SCORE: {article.analysis?.score || 0}
                            </Badge>
                            {expandedArticle === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedArticle === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-100 bg-slate-50/30"
                            >
                              <div className="p-5 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">AI Summary</h5>
                                    <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                                      "{article.analysis?.tldr || "No summary available."}"
                                    </p>
                                  </div>
                                  <div className="space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Analyst Rationale</h5>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                      {article.analysis?.rationale || "No rationale available."}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                  <div className="space-y-3">
                                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter flex items-center">
                                      <TrendingUp className="w-3 h-3 mr-2" /> Key Drivers
                                    </h5>
                                    <ul className="space-y-2">
                                      {article.analysis?.key_drivers.map((d, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                          <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                          {d}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="space-y-3">
                                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-tighter flex items-center">
                                      <ShieldAlert className="w-3 h-3 mr-2" /> Risks & Caveats
                                    </h5>
                                    <ul className="space-y-2">
                                      {article.analysis?.risks_or_caveats.map((r, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                          <div className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                          {r}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                   <p className="text-[10px] text-slate-400 italic">{article.analysis?.relevance_reason || "No relevance reason provided."}</p>
                                   <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5" asChild>
                                     <a href={article.link} target="_blank" rel="noreferrer">
                                       Original <ExternalLink className="w-3 h-3" />
                                     </a>
                                   </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                       <p className="text-slate-400 text-sm">Detailed deep dive data only available for HPG in this prototype.</p>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="evidence" className="mt-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <EvidenceFeed news={selectedSymbol ? getNewsForSymbols([selectedSymbol]) : []} selectedSymbol={selectedSymbol} />
                </motion.div>
              </TabsContent>

              <TabsContent value="dividends" className="mt-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                      <Coins className="w-3 h-3 mr-2" />
                      Dividend History
                      {selectedSymbol && <span className="ml-2 text-slate-400 font-normal">/ {selectedSymbol}</span>}
                    </h3>
                  </div>
                  <div className="overflow-auto max-h-80 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse relative">
                      <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-slate-100/95 backdrop-blur-sm border-b border-slate-200">
                          <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter">Ex-Date</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter">Description</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter">Type</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-right">Value/Ratio</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter text-right">Yield</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {(dividendHistory || [])?.map((div: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 text-xs font-mono font-bold text-slate-600">{div.date}</td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-bold text-slate-900 leading-tight">{div.title}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={cn(
                                "text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0 rounded",
                                div.type === 'CASH' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                              )}>
                                {div.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-xs font-mono font-bold text-slate-700">
                                {div.type === 'CASH' ? `${div.value.toLocaleString()}₫` : `${(div.ratio * 100).toFixed(0)}%`}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-xs font-mono font-bold text-emerald-600">
                                {div.yield_percent ? `${(div.yield_percent / 100).toFixed(2)}%` : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!dividendHistory || dividendHistory.length === 0) && (
                      <div className="p-12 text-center text-slate-400 text-sm">
                        No dividend data available for {selectedSymbol} in this prototype.
                      </div>
                    )}
                  </div>
                  </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}