import { useState, useCallback, useEffect, useRef } from 'react';
import { StockAnalysisResponse, getApiBaseUrl } from '@/api';

const API_BASE_URL = getApiBaseUrl();

export interface AnalysisStreamEvent {
  type: 'status' | 'progress' | 'article_analyzed' | 'summary_generated' | 'complete' | 'error';
  data: any;
}

interface CachedAnalysis {
  result: StockAnalysisResponse;
  timestamp: number;
}

interface BackgroundStream {
  symbol: string;
  eventSource: EventSource;
  events: AnalysisStreamEvent[];
}

// In-memory cache with expiration (1 hour)
const analysisCache = new Map<string, CachedAnalysis>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Track background streams that are still running
const backgroundStreams = new Map<string, BackgroundStream>();

export function useStockAnalysisStream(symbol: string | null) {
  const [events, setEvents] = useState<AnalysisStreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [finalResult, setFinalResult] = useState<StockAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ step: 0, total: 5, message: '' });
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentSymbolRef = useRef<string | null>(null);

  // Check cache when symbol changes
  useEffect(() => {
    if (!symbol) {
      setFinalResult(null);
      setEvents([]);
      setIsStreaming(false);
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
        console.log(`📦 Using cached analysis for ${symbol}`);
        setFinalResult(cached.result);
        setEvents([{ type: 'complete', data: { result: cached.result } }]);
        setError(null);
        setIsStreaming(false);
        return;
      } else {
        // Remove expired cache
        analysisCache.delete(symbol);
      }
    }

    // No valid cache, clear state
    setFinalResult(null);
    setEvents([]);
    setError(null);
    setIsStreaming(false);
  }, [symbol]);

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
    setEvents([]);
    setError(null);
    setFinalResult(null);
    setProgress({ step: 0, total: 5, message: '' });

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
              
              // Cache the result
              analysisCache.set(symbol, {
                result,
                timestamp: Date.now()
              });
              console.log(`💾 Cached analysis for ${symbol}`);
              
              eventSource.close();
              eventSourceRef.current = null;
              break;
            case 'error':
              setError(parsed.data.message);
              setIsStreaming(false);
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
                timestamp: Date.now()
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
      
      startAnalysis();
    }
  }, [symbol, startAnalysis]);

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
    finalResult,
    error,
    progress,
    startAnalysis,
    forceRefresh,
    hasCachedData: hasCachedData(),
  };
}