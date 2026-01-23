export type ApiError = {
	error: string;
};

/**
 * Build a stable query string from an object.
 * Undefined values are omitted.
 */
export function toQueryString(params: Record<string, string | number | boolean | undefined>) {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined) continue;
		search.set(key, String(value));
	}
	const qs = search.toString();
	return qs ? `?${qs}` : "";
}

export async function throwIfResNotOk(res: Response) {
	if (res.ok) return;
	const text = (await res.text()) || res.statusText;
	throw new Error(`${res.status}: ${text}`);
}

/**
 * Resolve the API base URL injected by Vite.
 *
 * Note: Vite only exposes env vars prefixed with VITE_.
 */
export function getApiBaseUrl(): string {
	const url = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
	if (!url) {
		// Keep this as a warning instead of throwing so devs can still boot UI.
		console.warn("[api] VITE_API_BASE_URL is not set. Requests may fail.");
		return "";
	}
	return url;
}

/**
 * Fetch JSON with shared behavior across APIs.
 * - includes credentials (cookies)
 * - throws on non-2xx
 */
export async function fetchJson<T>(
	url: string,
	options?: {
		signal?: AbortSignal;
		credentials?: RequestCredentials;
		logPrefix?: string;
	}
): Promise<T> {
	if (options?.logPrefix) console.log(`${options.logPrefix} GET`, url);
	const res = await fetch(url, {
		credentials: options?.credentials ?? "include",
		signal: options?.signal,
	});
	await throwIfResNotOk(res);
	return (await res.json()) as T;
}

