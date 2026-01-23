import type { Stock, PriceBoardEntry } from "./types";

/**
 * Convert price board entry to Stock UI format
 */
export function priceBoardEntryToStock(entry: PriceBoardEntry): Stock {
  return {
    symbol: entry.symbol,
    name: entry.symbol, // Will be updated when company info is available
    price: entry.price,
    change: entry.change,
    changePercent: entry.changePercent,
    volume: entry.volume.toString(),
  };
}

/**
 * Convert multiple price board entries to Stock array
 */
export function priceBoardToStocks(entries: PriceBoardEntry[]): Stock[] {
  return entries.map(priceBoardEntryToStock);
}

/**
 * Format volume number to readable string
 */
export function formatVolume(volume: number | string): string {
  if (typeof volume === "string") return volume;
  
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * Calculate change percentage from old and new price
 */
export function calculateChangePercent(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}
