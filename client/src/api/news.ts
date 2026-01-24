import { fetchJson, getApiBaseUrl, toQueryString } from "./utils";
import { ApiResult } from "./types";

const API_BASE_URL = getApiBaseUrl();
console.log("API_BASE_URL (news) =", API_BASE_URL);
const NEWS_BASE = `${API_BASE_URL}/api/v1/news`;

export const newsApi = {
  urls: {
    // News for a company symbol
    company: (
      symbol: string,
      params?: { limit?: number; source?: string; fallback?: boolean }
    ) =>
      `${NEWS_BASE}/company${toQueryString({
        symbol,
        limit: params?.limit,
        source: params?.source,
        fallback_to_google: params?.fallback,
      })}`,

    // Search news across sources (q param)
    search: (q: string) => `${NEWS_BASE}/search${toQueryString({ q })}`,

    // Latest headlines optionally filtered by comma-separated symbols and limit
    latest: (params?: { limit?: number; symbols?: string[] }) =>
      `${NEWS_BASE}/latest${toQueryString({
        limit: params?.limit,
        symbols: params?.symbols?.join(","),
      })}`,
  },

  /**
   * React-query friendly query keys.
   */
  queryKeys: {
    company: (
      symbol: string,
      params?: { limit?: number; source?: string; fallback?: boolean }
    ) => [newsApi.urls.company(symbol, params)] as const,
    search: (q: string) => [newsApi.urls.search(q)] as const,
    latest: (params?: { limit?: number; symbols?: string[] }) =>
      [newsApi.urls.latest(params)] as const,
  },

  getCompanyNews: <T = unknown>(
    symbol: string,
    opts?: {
      signal?: AbortSignal;
      limit?: number;
      source?: string; // e.g. "VCI"
      fallback?: boolean; // maps to fallback_to_google on server
    }
  ) =>
    fetchJson<ApiResult<T>>(
      newsApi.urls.company(symbol, {
        limit: opts?.limit ?? 10,
        source: opts?.source ?? "VCI",
        fallback: opts?.fallback ?? false,
      }),
      {
        signal: opts?.signal,
        logPrefix: "[newsApi]",
      }
    ),

  searchNews: <T = unknown>(q: string, options?: { signal?: AbortSignal }) =>
    fetchJson<ApiResult<T>>(newsApi.urls.search(q), {
      signal: options?.signal,
      logPrefix: "[newsApi]",
    }),

  getLatest: <T = unknown>(
    params?: { limit?: number; symbols?: string[] },
    options?: { signal?: AbortSignal }
  ) =>
    fetchJson<ApiResult<T>>(newsApi.urls.latest(params), {
      signal: options?.signal,
      logPrefix: "[newsApi]",
    }),
};

export default newsApi;