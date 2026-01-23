/**
 * Stock Store - Centralized state management for stock data
 * 
 * This module provides:
 * - Type definitions for stock data structures
 * - Context-based store for watchlist and selected symbol
 * - Utility functions for data transformation
 * 
 * @example
 * ```tsx
 * import { useStockStore } from '@/store';
 * 
 * function MyComponent() {
 *   const { watchlist, addToWatchlist, selectedSymbol } = useStockStore();
 *   // ...
 * }
 * ```
 */

export * from "./types";
export * from "./stockStore";
export * from "./utils";
