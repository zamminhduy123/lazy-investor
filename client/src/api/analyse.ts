import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StockAnalysisResponse } from "./types";
import { getApiBaseUrl } from "./utils";

const API_BASE_URL = getApiBaseUrl();

export const useStockAnalysis = (symbol: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["analysis", symbol],
    queryFn: async (): Promise<StockAnalysisResponse> => {
      if (!symbol) throw new Error("Symbol is required");
      
      const response = await apiRequest("GET", `${API_BASE_URL}/api/v1/analysis/${symbol}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }
      const res = await response.json();
      return res;
    },
    enabled: options?.enabled ?? !!symbol, // Auto-fetch if symbol exists, unless explicitly disabled
    staleTime: 1000 * 60 * 60, // Consider fresh for 1 hour (expensive AI analysis)
    gcTime: 1000 * 60 * 60 * 2, // Keep in cache for 2 hours after last use
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Use cached data if available when component mounts
  });
};
