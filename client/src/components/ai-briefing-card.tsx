import { useState, useEffect } from "react";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AI_BRIEFING_MOCK } from "@/lib/mock-data";

interface AIBriefingCardProps {
  selectedSymbol: string | null;
}

export function AIBriefingCard({ selectedSymbol }: AIBriefingCardProps) {
  const [state, setState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  
  // Reset state when selection changes, just to show the interaction
  useEffect(() => {
    setState('idle');
  }, [selectedSymbol]);

  const handleGenerate = () => {
    setState('analyzing');
    // Mock network request delay
    setTimeout(() => {
      setState('complete');
    }, 1500);
  };

  const sentimentColor = 
    AI_BRIEFING_MOCK.sentiment === 'bullish' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
    AI_BRIEFING_MOCK.sentiment === 'bearish' ? 'text-rose-600 bg-rose-50 border-rose-100' :
    'text-amber-600 bg-amber-50 border-amber-100';

  const sentimentIcon = 
    AI_BRIEFING_MOCK.sentiment === 'bullish' ? <TrendingUp className="w-4 h-4 mr-1" /> :
    AI_BRIEFING_MOCK.sentiment === 'bearish' ? <TrendingDown className="w-4 h-4 mr-1" /> :
    <Minus className="w-4 h-4 mr-1" />;

  return (
    <div className="w-full my-6 perspective-1000">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="w-full bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
            
            <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-slate-400 group-hover:text-yellow-500 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Daily Market Intelligence
              </h3>
              <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                {selectedSymbol 
                  ? `Generate a consolidated briefing for ${selectedSymbol} from the latest news and reports.` 
                  : "Consolidate all market news into a single, high-impact executive summary."}
              </p>
              <Button 
                onClick={handleGenerate}
                size="lg" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                data-testid="btn-generate-briefing"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Briefing
              </Button>
            </div>
          </motion.div>
        )}

        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full h-[300px] bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center shadow-sm"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-slate-100 rounded-full animate-ping opacity-25" />
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 relative z-10">
                <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
              </div>
            </div>
            <p className="mt-6 text-slate-600 font-medium animate-pulse">
              Analyzing market sentiment for {selectedSymbol || "market"}...
            </p>
            <p className="text-xs text-slate-400 mt-2">Reading 14 new articles</p>
          </motion.div>
        )}

        {state === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5"
          >
            <div className="p-1 h-1 bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500" />
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      AI GENERATED • {new Date().toLocaleDateString()}
                    </span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center", sentimentColor)}>
                      {sentimentIcon}
                      {AI_BRIEFING_MOCK.sentiment.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                    {AI_BRIEFING_MOCK.headline}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setState('idle')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {AI_BRIEFING_MOCK.takeaways.map((point, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="flex items-start group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-slate-700 leading-relaxed text-base group-hover:text-slate-900 transition-colors">
                      {point}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  Based on analysis of real-time market data and news sources.
                </p>
                <div className="flex space-x-2">
                   <Button variant="outline" size="sm" className="text-xs h-8 text-slate-500">
                     Share
                   </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
