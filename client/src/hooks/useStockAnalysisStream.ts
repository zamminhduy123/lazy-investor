import { useState, useCallback } from 'react';
import { StockAnalysisResponse, getApiBaseUrl } from '@/api';

const API_BASE_URL = getApiBaseUrl();

export interface AnalysisStreamEvent {
  type: 'status' | 'progress' | 'article_analyzed' | 'summary_generated' | 'complete' | 'error';
  data: any;
}

export function useStockAnalysisStream(symbol: string | null) {
  const [events, setEvents] = useState<AnalysisStreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [finalResult, setFinalResult] = useState<StockAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ step: 0, total: 5, message: '' });

  const startAnalysis = useCallback(() => {
    if (!symbol) return;

    setIsStreaming(true);
    setEvents([]);
    setError(null);
    setFinalResult(null);

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/v1/analysis/${symbol}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const parsed: AnalysisStreamEvent = JSON.parse(event.data);
        
        setEvents((prev) => [...prev, parsed]);

        switch (parsed.type) {
          case 'progress':
            setProgress(parsed.data);
            break;
          case 'complete':
            setFinalResult(parsed.data.result);
            setIsStreaming(false);
            eventSource.close();
            break;
          case 'error':
            setError(parsed.data.message);
            setIsStreaming(false);
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Connection lost');
      setIsStreaming(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [symbol]);

  return {
    events,
    isStreaming,
    finalResult,
    error,
    progress,
    startAnalysis,
  };
}