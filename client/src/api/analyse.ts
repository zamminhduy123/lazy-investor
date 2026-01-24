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
    enabled: options?.enabled ?? false, // Default to false to prevent auto-fetching (expensive AI API)
    staleTime: 1000 * 60 * 30, // Consider fresh for 30 minutes
    retry: 1,
  });
};
