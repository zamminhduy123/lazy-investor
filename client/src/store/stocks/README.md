# Stock State Management System

This directory contains the state management system for stock data in the application.

## Structure

```
store/
├── types.ts          # Type definitions for stock data structures
├── stockStore.tsx    # Context-based store for UI state (watchlist, selected symbol)
├── utils.ts          # Utility functions for data transformation
└── index.ts          # Barrel export for clean imports
```

## Features

### 1. Type-Safe Data Structures
All stock data types are defined in `types.ts`, ensuring type safety across the application.

### 2. Context-Based UI State
The `StockStoreProvider` manages:
- **Watchlist**: List of stocks the user is tracking
- **Selected Symbol**: Currently selected stock symbol
- **Actions**: Add/remove from watchlist, select symbol

### 3. React Query Integration
Custom hooks in `hooks/useStocks.ts` provide:
- Automatic caching
- Background refetching
- Loading and error states
- Optimistic updates

## Usage

### Setting Up the Store

The store is already set up in `App.tsx`:

```tsx
import { StockStoreProvider } from "@/store/stockStore";

function App() {
  return (
    <StockStoreProvider>
      {/* Your app */}
    </StockStoreProvider>
  );
}
```

### Using the Store

```tsx
import { useStockStore } from "@/store";

function MyComponent() {
  const {
    watchlist,
    selectedSymbol,
    addToWatchlist,
    removeFromWatchlist,
    setSelectedSymbol,
    isInWatchlist,
  } = useStockStore();

  return (
    <div>
      {watchlist.map((stock) => (
        <div key={stock.symbol}>{stock.symbol}</div>
      ))}
    </div>
  );
}
```

### Fetching Stock Data

```tsx
import { useStockQuote, useStockData } from "@/hooks/useStocks";

function StockDetails({ symbol }: { symbol: string }) {
  // Fetch single stock quote
  const { data, isLoading, error } = useStockQuote(symbol);

  // Or fetch comprehensive data
  const stockData = useStockData(symbol);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Render stock data */}</div>;
}
```

### Available Hooks

- `useStockQuote(symbol, options)` - Get stock quote/history
- `useStockIntraday(symbol)` - Get intraday data
- `usePriceDepth(symbol)` - Get order book data
- `useCompanyInfo(symbol)` - Get company information
- `useShareholders(symbol)` - Get shareholders data
- `usePriceBoard(symbols[])` - Get price board for multiple symbols
- `useAllSymbols()` - Get all available symbols
- `useIndices()` - Get market indices
- `useStockData(symbol)` - Get comprehensive data (combines multiple endpoints)

## Background Prefetching

The `StockDataPrefetcher` component automatically prefetches:
- All available symbols (for search)
- Market indices (for overview)
- Price board data for watchlist symbols
- Quote data for each watchlist symbol

This ensures data is available immediately when users interact with the app.

## Data Flow

1. **App Loads** → `StockDataPrefetcher` prefetches initial data
2. **User Adds Stock** → Added to watchlist via `useStockStore`
3. **Component Needs Data** → Uses hooks like `useStockQuote`
4. **React Query** → Checks cache, fetches if needed, updates UI
5. **Data Updates** → Components automatically re-render with new data

## Watchlist Initialization

The watchlist is initialized in `dashboard.tsx` with mock data when empty. You can customize this behavior by modifying the initialization logic in the Dashboard component.

## Best Practices

1. **Use hooks for data fetching** - Don't call API directly, use the provided hooks
2. **Leverage React Query caching** - Data is cached automatically, no need to manage cache manually
3. **Handle loading/error states** - All hooks provide `isLoading` and `error` states
4. **Use the store for UI state** - Watchlist and selection should use `useStockStore`
5. **Type safety** - Import types from `@/store/types` for type-safe data handling
