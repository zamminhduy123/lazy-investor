import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/api';

const API_BASE_URL = getApiBaseUrl();

export interface Signal {
  id: number;
  symbol: string;
  type: 'dividend' | 'earnings' | 'contract' | 'government' | 'expansion' | 'leadership';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detected_at: string;
  expires_at: string | null;
}

export interface SignalsResponse {
  signals: Signal[];
}

/**
 * Fetch investment signals (dividends, earnings, major events)
 * These are automatically detected from analyzed news by the background worker
 */
export function useSignals(unreadOnly: boolean = true, limit: number = 20) {
  return useQuery<SignalsResponse>({
    queryKey: ['signals', unreadOnly, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        unread_only: unreadOnly.toString(),
        limit: limit.toString()
      });
      
      const res = await fetch(
        `${API_BASE_URL}/api/v1/analysis/signals/latest?${params}`
      );
      
      if (!res.ok) {
        throw new Error('Failed to fetch signals');
      }
      
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    refetchInterval: 1000 * 60 * 10, // Auto-refresh every 10 minutes
  });
}

/**
 * Mark a signal as read
 */
export function useMarkSignalRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signalId: number) => {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/analysis/signals/${signalId}/mark_read`,
        { method: 'POST' }
      );
      
      if (!res.ok) {
        throw new Error('Failed to mark signal as read');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate signals query to refetch
      queryClient.invalidateQueries({ queryKey: ['signals'] });
    }
  });
}
