import { useState, useCallback, useEffect, useRef } from 'react';
import { StockAnalysisResponse, getApiBaseUrl } from '@/api';

const API_BASE_URL = getApiBaseUrl();

/**
 * Stock Analysis Hook - Upgraded for Background Job Architecture
 * 
 * This hook prioritizes instant pre-analyzed data from background jobs over streaming.
 * 
 * **Flow:**
 * 1. Check cache (1hr TTL)
 * 2. Fetch instant pre-analyzed data from DB (⚡ fast, preferred)
 * 3. Fallback: Manual streaming if no data exists (🐌 slow, legacy)
 * 
 * **New Features:**
 * - `dataSource`: 'instant' | 'stream' - indicates data origin
 * - `isLoading`: true while fetching instant data
 * - `weeklySummary`: weekly trend analysis (sentiment, themes, outlook)
 * - Auto-fetches on symbol change (no manual trigger needed for instant data)
 * 
 * **Usage:**
 * ```tsx
 * const { finalResult, isLoading, dataSource, weeklySummary } = useStockAnalysisStream(symbol);
 * 
 * // Data auto-loads on mount if pre-analyzed
 * // Use startAnalysis() only if finalResult is null (no pre-analyzed data)
 * ```
 */

export interface AnalysisStreamEvent {
  type: 'status' | 'progress' | 'article_analyzed' | 'summary_generated' | 'complete' | 'error';
  data: any;
}

interface CachedAnalysis {
  result: StockAnalysisResponse;
  timestamp: number;
  source: 'instant' | 'stream'; // Track data source
}

interface BackgroundStream {
  symbol: string;
  eventSource: EventSource;
  events: AnalysisStreamEvent[];
}

export interface WeeklySummary {
  symbol: string;
  week_start: string;
  week_end: string;
  total_articles: number;
  sentiment_distribution: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  avg_score: number;
  trend_direction: string;
  key_themes: string[];
  momentum_shift: string;
  outlook: string;
  analyzed_at: string;
}

// In-memory cache with expiration (1 hour)
const analysisCache = new Map<string, CachedAnalysis>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Track background streams that are still running
const backgroundStreams = new Map<string, BackgroundStream>();

export function useStockAnalysisStream(symbol: string | null) {
  const [events, setEvents] = useState<AnalysisStreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [finalResult, setFinalResult] = useState<StockAnalysisResponse | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ step: 0, total: 5, message: '' });
  const [dataSource, setDataSource] = useState<'instant' | 'stream' | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentSymbolRef = useRef<string | null>(null);

  // Check cache when symbol changes
  useEffect(() => {
    if (!symbol) {
      setFinalResult(null);
      setWeeklySummary(null);
      setEvents([]);
      setIsStreaming(false);
      setIsLoading(false);
      setDataSource(null);
      currentSymbolRef.current = null;
      return;
    }

    currentSymbolRef.current = symbol;

    // Check if there's a background stream for this symbol
    const bgStream = backgroundStreams.get(symbol);
    if (bgStream) {
      console.log(`🔄 Resuming background stream for ${symbol}`);
      setEvents(bgStream.events);
      setIsStreaming(true);
      setDataSource('stream');
      eventSourceRef.current = bgStream.eventSource;
      
      // Remove from background streams since we're now actively watching it
      backgroundStreams.delete(symbol);
      return;
    }

    // Check regular cache
    const cached = analysisCache.get(symbol);
    if (cached) {
      const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
      
      if (!isExpired) {
        console.log(`📦 Using cached analysis for ${symbol} (source: ${cached.source})`);
        setFinalResult(cached.result);
        setEvents([{ type: 'complete', data: { result: cached.result } }]);
        setError(null);
        setIsStreaming(false);
        setIsLoading(false);
        setDataSource(cached.source);
        return;
      } else {
        // Remove expired cache
        analysisCache.delete(symbol);
      }
    }

    // No valid cache, try to fetch instant pre-analyzed data
    fetchInstantAnalysis(symbol);
  }, [symbol]);

  // NEW: Fetch instant pre-analyzed data from background jobs
  const fetchInstantAnalysis = async (sym: string) => {
    if (!sym) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch both analysis and weekly summary in parallel
      const [analysisRes, weeklyRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/v1/analysis/${sym}`),
        fetch(`${API_BASE_URL}/api/v1/analysis/${sym}/weekly`)
      ]);

      // Handle analysis response
      if (analysisRes.status === 'fulfilled' && analysisRes.value.ok) {
        const result: StockAnalysisResponse = await analysisRes.value.json();
        
        console.log(`⚡ Got instant pre-analyzed data for ${sym}`);
        setFinalResult(result);
        setDataSource('instant');
        setIsLoading(false);
        
        // Cache the instant result
        analysisCache.set(sym, {
          result,
          timestamp: Date.now(),
          source: 'instant'
        });

        // Simulate completion event for UI consistency
        setEvents([{ 
          type: 'complete', 
          data: { result, source: 'database' } 
        }]);
      } else {
        // No pre-analyzed data available, will need to stream
        console.log(`⚠️  No pre-analyzed data for ${sym}, streaming required`);
        setIsLoading(false);
        // Don't auto-start streaming, let user explicitly request it
      }

      // Handle weekly summary response
      if (weeklyRes.status === 'fulfilled' && weeklyRes.value.ok) {
        const weekly: WeeklySummary = await weeklyRes.value.json();
        console.log(`📊 Got weekly summary for ${sym}`);
        setWeeklySummary(weekly);
      }

    } catch (err) {
      console.error('Failed to fetch instant analysis:', err);
      setError('Failed to load analysis data');
      setIsLoading(false);
    }
  };

  const startAnalysis = useCallback(() => {
    if (!symbol) return;

    // If already streaming for this symbol, don't restart
    if (eventSourceRef.current && currentSymbolRef.current === symbol) {
      console.log(`⏩ Already analyzing ${symbol}`);
      return;
    }

    // Close any existing connection for a different symbol
    if (eventSourceRef.current && currentSymbolRef.current !== symbol) {
      console.log(`⏸️ Moving previous stream (${currentSymbolRef.current}) to background`);
      
      // Move current stream to background
      if (currentSymbolRef.current) {
        backgroundStreams.set(currentSymbolRef.current, {
          symbol: currentSymbolRef.current,
          eventSource: eventSourceRef.current,
          events: [...events]
        });
      }
    }

    currentSymbolRef.current = symbol;
    setIsStreaming(true);
    setIsLoading(true);
    setEvents([]);
    setError(null);
    setFinalResult(null);
    setDataSource('stream');
    setProgress({ step: 0, total: 5, message: '' });

    console.log(`🔴 Starting legacy streaming analysis for ${symbol} (slow)`);

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/v1/analysis/${symbol}/stream`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const parsed: AnalysisStreamEvent = JSON.parse(event.data);
        
        // Only update state if this stream is still for the current symbol
        if (currentSymbolRef.current === symbol) {
          setEvents((prev) => [...prev, parsed]);

          switch (parsed.type) {
            case 'progress':
              setProgress(parsed.data);
              break;
            case 'complete':
              const result = parsed.data.result;
              setFinalResult(result);
              setIsStreaming(false);
              setIsLoading(false);
              
              // Cache the result
              analysisCache.set(symbol, {
                result,
                timestamp: Date.now(),
                source: 'stream'
              });
              console.log(`💾 Cached streamed analysis for ${symbol}`);
              
              eventSource.close();
              eventSourceRef.current = null;
              break;
            case 'error':
              setError(parsed.data.message);
              setIsStreaming(false);
              setIsLoading(false);
              eventSource.close();
              eventSourceRef.current = null;
              break;
          }
        } else {
          // This stream is for a different symbol now (in background)
          // Update the background stream's events
          const bgStream = backgroundStreams.get(symbol);
          if (bgStream) {
            bgStream.events.push(parsed);
            
            // If it completed in the background, cache it
            if (parsed.type === 'complete') {
              const result = parsed.data.result;
              analysisCache.set(symbol, {
                result,
                timestamp: Date.now(),
                source: 'stream'
              });
              console.log(`💾 Background stream completed and cached for ${symbol}`);
              eventSource.close();
              backgroundStreams.delete(symbol);
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      
      if (currentSymbolRef.current === symbol) {
        setError('Connection lost');
        setIsStreaming(false);
        setIsLoading(false);
      }
      
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
      
      // Clean up background stream if it exists
      backgroundStreams.delete(symbol);
    };
  }, [symbol, events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Move to background instead of closing
      if (eventSourceRef.current && currentSymbolRef.current) {
        console.log(`⏸️ Component unmounting, moving ${currentSymbolRef.current} to background`);
        backgroundStreams.set(currentSymbolRef.current, {
          symbol: currentSymbolRef.current,
          eventSource: eventSourceRef.current,
          events: [...events]
        });
      }
    };
  }, [events]);

  // Helper to force refresh (ignores cache and stops any background stream)
  const forceRefresh = useCallback(() => {
    if (symbol) {
      analysisCache.delete(symbol);
      
      // Stop background stream if it exists
      const bgStream = backgroundStreams.get(symbol);
      if (bgStream) {
        bgStream.eventSource.close();
        backgroundStreams.delete(symbol);
      }
      
      // Close current stream if running
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Fetch fresh instant data first
      fetchInstantAnalysis(symbol);
    }
  }, [symbol]);

  // Helper to refresh weekly summary
  const refreshWeeklySummary = useCallback(async () => {
    if (!symbol) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/analysis/${symbol}/weekly`);
      if (res.ok) {
        const weekly: WeeklySummary = await res.json();
        setWeeklySummary(weekly);
      }
    } catch (err) {
      console.error('Failed to refresh weekly summary:', err);
    }
  }, [symbol]);

  // Helper to check if cached data exists
  const hasCachedData = useCallback(() => {
    if (!symbol) return false;
    const cached = analysisCache.get(symbol);
    if (!cached) return false;
    return Date.now() - cached.timestamp <= CACHE_DURATION;
  }, [symbol]);

  return {
    events,
    isStreaming,
    isLoading,
    finalResult,
    weeklySummary,
    error,
    progress,
    dataSource,
    startAnalysis, // Legacy streaming (slow, only use if no instant data)
    forceRefresh,
    refreshWeeklySummary,
    hasCachedData: hasCachedData(),
  };
}