from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import and_

from vnstock import Quote, Company, Listing, Trading

from app.utils.stock_utils import to_jsonable
from app.db.session import SessionLocal
from app.db.models import StockHistory, StockSymbol


def save_stock_history(symbol: str, df: pd.DataFrame, interval: str):
    db: Session = SessionLocal()
    try:
        records = []
        for _, row in df.iterrows():
            # Ensure time is a date object
            time_val = row.get('time')
            if isinstance(time_val, str):
                try:
                    time_val = datetime.strptime(time_val, "%Y-%m-%d").date()
                except ValueError:
                     # Handle cases where might be other format or already date
                     pass
            
            # Create object but don't add yet
            record = {
                "symbol": symbol,
                "time": time_val,
                "open": row.get('open'),
                "high": row.get('high'),
                "low": row.get('low'),
                "close": row.get('close'),
                "volume": row.get('volume'),
                "interval": interval
            }
            
            # Simple upsert logic
            existing = db.query(StockHistory).filter(
                StockHistory.symbol == symbol,
                StockHistory.time == time_val,
                StockHistory.interval == interval
            ).first()
            
            if not existing:
                db_record = StockHistory(**record)
                db.add(db_record)
            else:
                for key, value in record.items():
                    setattr(existing, key, value)
        
        db.commit()
    except Exception as e:
        print(f"Error saving to DB: {e}")
        db.rollback()
    finally:
        db.close()

def save_symbols_to_db(symbols_list: List[Dict[str, Any]]):
    db: Session = SessionLocal()
    try:
        for item in symbols_list:
            sym = item.get('symbol') or item.get('ticker')
            name = item.get('organ_short_name') or item.get('organ_name') # Vnstock mapping varies
            if not sym:
                continue
            
            existing = db.query(StockSymbol).filter(StockSymbol.symbol == sym).first()
            if not existing:
                db.add(StockSymbol(symbol=sym, name=name, exchange=item.get('exchange')))
        db.commit()
    except Exception as e:
        print(f"Error saving symbols: {e}")
        db.rollback()
    finally:
        db.close()

def get_symbols_from_db() -> List[Dict[str, Any]]:
    db: Session = SessionLocal()
    try:
        results = db.query(StockSymbol).all()
        return [{"symbol": r.symbol, "organName": r.name, "comGroupCode": r.exchange} for r in results]
    finally:
        db.close()

def get_history_from_db(symbol: str, start_date: str, end_date: str, interval: str) -> pd.DataFrame:
    db: Session = SessionLocal()
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        results = db.query(StockHistory).filter(
            StockHistory.symbol == symbol,
            StockHistory.interval == interval,
            StockHistory.time >= start,
            StockHistory.time <= end
        ).order_by(StockHistory.time).all()
        
        if not results:
            return pd.DataFrame()
            
        data = []
        for r in results:
            data.append({
                "time": r.time.strftime("%Y-%m-%d"),
                "open": r.open,
                "high": r.high,
                "low": r.low,
                "close": r.close,
                "volume": r.volume,
                "ticker": r.symbol # match vnstock format often containing ticker/symbol
            })
            
        return pd.DataFrame(data)
    finally:
        db.close()


def _default_dates(start_date: Optional[str], end_date: Optional[str]) -> tuple[str, str]:
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    return start_date, end_date


def _ok(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Ensure JSON-safe conversion at the service boundary
    payload.setdefault("status", "ok")
    # print( to_jsonable(payload))
    return to_jsonable(payload)


def _no_data(payload: Dict[str, Any], message: str) -> Dict[str, Any]:
    payload.setdefault("status", "no_data")
    payload.setdefault("message", message)
    return to_jsonable(payload)


def _err(message: str, **extra: Any) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"error": message}
    payload.update(extra)
    return to_jsonable(payload)


def get_market_context(symbol: str) -> str:
    """
    Get today's price action as a string context for AI analysis.
    """
    try:
        quote = Quote(source="VCI", symbol=symbol.upper())
        df = quote.history(
            interval='1D', 
            start=datetime.now().strftime("%Y-%m-%d"), 
            end=datetime.now().strftime("%Y-%m-%d")
        )
        
        if not df is None and not df.empty:
            close = df['close'].iloc[-1]
            open_price = df['open'].iloc[-1]
            if open_price:
                change = ((close - open_price) / open_price) * 100
                return f"Stock Price Today: {close} (Change: {change:.2f}%)"
        return "Stock Price: Data Unavailable"
    except Exception as e:
        print(f"Market context error for {symbol}: {e}")
        return "Stock Price: Data Unavailable (API Error)"


def get_stock_quote(
    symbol: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    interval: str = "1D",
) -> Dict[str, Any]:
    start_date, end_date = _default_dates(start_date, end_date)
    
    try:
        quote = Quote(source="VCI", symbol=symbol.upper())
        df = quote.history(interval=interval, start=start_date, end=end_date)
        
        if getattr(df, "empty", True):
             # Try fallback to DB if API returns empty (might be limit or just no data)
            print(f"API returned empty for {symbol}, checking DB...")
            df_db = get_history_from_db(symbol.upper(), start_date, end_date, interval)
            if not df_db.empty:
                return _ok({"symbol": symbol.upper(), "data": df_db, "count": len(df_db)})
                
            return _no_data(
                {"symbol": symbol.upper(), "data": [], "count": 0},
                "No quote data available for the selected range (API & DB Empty).",
            )
        
        # Valid API response -> Save to DB
        save_stock_history(symbol.upper(), df, interval)

        return _ok({"symbol": symbol.upper(), "data": df, "count": len(df)})
    except Exception as e:
        print(f"API Error for {symbol}: {e}, checking DB...")
        # Fallback to DB on error
        try:
            df_db = get_history_from_db(symbol.upper(), start_date, end_date, interval)
            if not df_db.empty:
                return _ok({"symbol": symbol.upper(), "data": df_db, "count": len(df_db)})
        except Exception as db_e:
            print(f"DB Error: {db_e}")
            
        return _err(f"Failed to fetch quote data: {str(e)}", symbol=symbol.upper())


def get_stock_intraday(symbol: str) -> Dict[str, Any]:
    quote = Quote(source="VCI", symbol=symbol.upper())

    try:
        # vnstock variants differ; handle both call styles
        try:
            df = quote.intraday(symbol=symbol.upper(), show_log=False)
        except TypeError:
            df = quote.intraday()
    except Exception as e:
        msg = str(e)
        # When market is closed, some providers throw instead of returning empty DF
        return _no_data(
            {"symbol": symbol.upper(), "data": [], "count": 0},
            f"No intraday data available (market may be closed). ({msg})",
        )

    if len(df) == 0:
        return _no_data(
            {"symbol": symbol.upper(), "data": [], "count": 0},
            "No intraday data available (market may be closed).",
        )

    return _ok({"symbol": symbol.upper(), "data": df, "count": len(df)})


def get_stock_price_depth(symbol: str) -> Dict[str, Any]:
    try:
        quote = Quote(source="VCI", symbol=symbol.upper())
        depth = quote.price_depth()

        if len(depth) == 0:
            return _no_data(
                {"symbol": symbol.upper(), "data": {}},
                "No price depth data available (market may be closed).",
            )

        return _ok({"symbol": symbol.upper(), "data": depth})
    except Exception as e:
        return _err(f"Failed to fetch price depth: {str(e)}", symbol=symbol.upper())


def get_company_info(symbol: str) -> Dict[str, Any]:
    try:
        company = Company(source="VCI", symbol=symbol.upper())
        overview = company.overview()

        if len(overview) == 0:
            return _no_data(
                {"symbol": symbol.upper(), "data": {}},
                "No company information available.",
            )

        return _ok({"symbol": symbol.upper(), "data": overview})
    except Exception as e:
        return _err(f"Failed to fetch company info: {str(e)}", symbol=symbol.upper())


def get_company_shareholders(symbol: str) -> Dict[str, Any]:
    try:
        company = Company(source="VCI", symbol=symbol.upper())
        shareholders = company.shareholders()

        if len(shareholders) == 0:
            return _no_data(
                {"symbol": symbol.upper(), "data": []},
                "No shareholders data available.",
            )

        return _ok({"symbol": symbol.upper(), "data": shareholders})
    except Exception as e:
        return _err(f"Failed to fetch shareholders: {str(e)}", symbol=symbol.upper())


def get_price_board(symbols: List[str]) -> Dict[str, Any]:
    try:
        trading = Trading(source="VCI")
        symbols = [s.strip().upper() for s in symbols if s and s.strip()]
        board = trading.price_board(symbols)['ref_price']
        
        print("Fetched price board:", to_jsonable(board))

        if len(board) == 0:
            return _no_data(
                {"symbols": symbols, "data": [], "count": 0},
                "No price board data available (market may be closed).",
            )

        return _ok({"data": to_jsonable(board), "count": len(board), "symbols": symbols})
    except Exception as e:
        return _err(f"Failed to fetch price board: {str(e)}", symbols=symbols)

# Temporary cache to avoid rate limits during testing
_stock_info_cache: Dict[str, Any] = {}

def get_stock_info(symbols: List[str]) -> Dict[str, Any]:
    try:
        symbols = [s.strip().upper() for s in symbols if s and s.strip()]
        
        stock_info = {}
        for symbol in symbols:
            # Check cache first
            if symbol in _stock_info_cache:
                stock_info[symbol] = _stock_info_cache[symbol]
                continue

            quote = Quote(source="VCI", symbol=symbol)    
            df = quote.history(interval='1D', start=datetime.now().strftime("%Y-%m-%d"), end=datetime.now().strftime("%Y-%m-%d"))
            close = df['close'].iloc[-1]
            change = close - df['open'].iloc[-1]
            volume = df['volume'].iloc[-1]
            change_percentage = ((change) / df['open'].iloc[-1]) * 100
            
            data = {
                "close": close,
                "change": change,
                "change_percentage": change_percentage,
                "volume": volume
            }
            stock_info[symbol] = data
            _stock_info_cache[symbol] = data
            
        print("Fetched stock info:", to_jsonable(stock_info))

        if len(stock_info.keys()) == 0:
            return _no_data(
                {"symbols": symbols, "data": [], "count": 0},
                "No price board data available (market may be closed).",
            )

        return _ok({"data": to_jsonable(stock_info), "count": len(stock_info.keys()), "symbols": symbols})
    except Exception as e:
        return _err(f"Failed to fetch price board: {str(e)}", symbols=symbols)

def get_all_symbols() -> Dict[str, Any]:
    # Try DB first
    db_symbols = get_symbols_from_db()
    # print("DB symbols:", db_symbols)
    if db_symbols and len(db_symbols) > 0:
        return _ok({"data": db_symbols, "count": len(db_symbols)})

    try:
        listing = Listing(source="VCI")
        all_symbols = listing.symbols_by_exchange()
        # print("Fetched all symbols:", all_symbols)
        symbols = to_jsonable(all_symbols)

        if len(symbols) == 0:
            return _no_data({"data": [], "count": 0}, "No symbols available.")
        
        # Save to DB
        save_symbols_to_db(symbols)

        return _ok({"data": symbols, "count": len(symbols)})
    except Exception as e:
         # One last check on DB even on error if we didn't check before (logic flow ensures we did, but good hygiene)
        return _err(f"Failed to fetch all symbols: {str(e)}")


def get_indices() -> Dict[str, Any]:
    try:
        listing = Listing(source="VCI")
        indices = listing.all_indices()

        syms: List[str] = []
        if len(indices) > 0 and hasattr(indices, "columns") and "symbol" in indices.columns:
            syms = indices["symbol"].tolist()

        return _ok({"data": syms, "count": len(syms)})
    except Exception as e:
        return _err(f"Failed to fetch indices: {str(e)}")
    
def get_stock_performance(symbol: str) -> Dict[str, Any]:
    """
    Calculates 1-Week, 1-Month, 3-Month, 6-Month, and 1-Year performance.
    Logic: 
    - 1 Week approx = 5 trading sessions
    - 1 Month approx = 20 trading sessions
    - 3 Months approx = 63 trading sessions
    - 6 Months approx = 125 trading sessions
    - 1 Year approx = 250 trading sessions
    """
    try:
        # Fetch enough history (~400 days to cover 1 year of trading sessions + holidays)
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=400)).strftime("%Y-%m-%d")
        
        quote = Quote(source="vci", symbol=symbol)
        # Fetch Daily (1D) data
        df = quote.history(start=start_date, end=end_date, interval='1D')
        
        if df.empty or len(df) < 2:
            return {"1W": "N/A", "1M": "N/A", "3M": "N/A", "6M": "N/A", "1Y": "N/A"}

        # Get the Latest Close Price (The last row)
        current_price = df['close'].iloc[-1]
        
        # --- CALCULATE 1 WEEK (5 Sessions ago) ---
        if len(df) >= 6:
            price_1w = df['close'].iloc[-6]
            pct_1w = ((current_price - price_1w) / price_1w) * 100
            str_1w = f"{pct_1w:+.1f}%"
        else:
            str_1w = "N/A"

        # --- CALCULATE 1 MONTH (20 Sessions ago) ---
        if len(df) >= 21:
            price_1m = df['close'].iloc[-21]
            pct_1m = ((current_price - price_1m) / price_1m) * 100
            str_1m = f"{pct_1m:+.1f}%"
        else:
            str_1m = "N/A"

        # --- CALCULATE 3 MONTHS (63 Sessions ago) ---
        if len(df) >= 64:
            price_3m = df['close'].iloc[-64]
            pct_3m = ((current_price - price_3m) / price_3m) * 100
            str_3m = f"{pct_3m:+.1f}%"
        else:
            str_3m = "N/A"

        # --- CALCULATE 6 MONTHS (125 Sessions ago) ---
        if len(df) >= 126:
            price_6m = df['close'].iloc[-126]
            pct_6m = ((current_price - price_6m) / price_6m) * 100
            str_6m = f"{pct_6m:+.1f}%"
        else:
            str_6m = "N/A"

        # --- CALCULATE 1 YEAR (250 Sessions ago) ---
        if len(df) >= 251:
            price_1y = df['close'].iloc[-251]
            pct_1y = ((current_price - price_1y) / price_1y) * 100
            str_1y = f"{pct_1y:+.1f}%"
        else:
            str_1y = "N/A"
            
        return {"1W": str_1w, "1M": str_1m, "3M": str_3m, "6M": str_6m, "1Y": str_1y}

    except Exception as e:
        print(f"Error calculating performance for {symbol}: {e}")
        return {"1W": "N/A", "1M": "N/A", "3M": "N/A", "6M": "N/A", "1Y": "N/A"}
    
def get_stock_dividends(symbol: str) -> Dict[str, Any]:
    """
    Fetches dividend events (cash and stock), matches them with historical price
    to calculating approximate yield at the time of the event.
    """
    try:
        symbol = symbol.upper()
        
        # 1. Fetch Company Events using vnstock
        company = Company(symbol=symbol, source='VCI')
        try:
            events_df = company.events(page_size=50) # Fetch enough recent events
        except Exception:
            # Fallback if VCI fails or empty
            return _err(f"No event data available for {symbol}")

        if events_df is None or events_df.empty:
             return _ok({"symbol": symbol, "data": []})

        # 2. Filter for Dividends (Cash or Stock)
        # Keywords: "cổ tức" (dividend), "trả" (pay), "thưởng" (bonus/reward)
        dividend_mask = (
            events_df["event_title"].str.contains("cổ tức", case=False, na=False) |
            events_df["event_title"].str.contains("thưởng", case=False, na=False) |
             events_df["event_title"].str.contains("trả", case=False, na=False)
        )
        
        div_df = events_df[dividend_mask].copy()
        
        if div_df.empty:
             return _ok({"symbol": symbol, "data": []})

        # Ensure dates are datetime objects
        div_df["exright_date"] = pd.to_datetime(div_df["exright_date"], errors="coerce")
        div_df = div_df.dropna(subset=['exright_date']).sort_values("exright_date")

        # 3. Fetch History to calculate Yield (Yield = Dividend Value / Price at Ex-Date)
        # We need a range covering the oldest event to today
        min_date = div_df["exright_date"].min()
        start_str = (min_date - timedelta(days=5)).strftime("%Y-%m-%d")
        end_str = datetime.now().strftime("%Y-%m-%d")

        quote = Quote(source="VCI", symbol=symbol)
        price_df = quote.history(start=start_str, end=end_str, interval="1D")

        results = []
        
        if not price_df.empty:
            price_df["time"] = pd.to_datetime(price_df["time"], errors="coerce")
            price_df = price_df.sort_values("time")
            
            # Prepare for merge_asof
            price_sub = price_df[["time", "close"]].rename(columns={"time": "date"}).dropna()
            
            # Merge events with price (find last price <= exright_date)
            merged = pd.merge_asof(
                div_df,
                price_sub,
                left_on="exright_date",
                right_on="date",
                direction="backward" 
            )
            merged.fillna(0)

            # Process individual rows
            for _, row in merged.iterrows():
                # Extract value
                val = row.get('value')
                ratio = row.get('ratio')
                
                # Try convert value to float, handle '0' or None
                try:
                    val_float = float(val) if val else 0.0
                except (ValueError, TypeError):
                    val_float = 0.0
                
                # Calculate Yield if it's a cash dividend (value > 0)
                div_yield = 0.0
                close_price = row.get('close')
                
                if val_float > 0 and close_price and close_price > 0:
                    div_yield = (val_float / close_price) * 100

                # Determine Type
                event_type = "STOCK"
                if "tiền" in str(row.get("event_title", "")).lower() or val_float > 0:
                    event_type = "CASH"

                # Sanitize output to handle NaN values from pandas operations
                safe_val = val_float if not pd.isna(val_float) else 0.0
                safe_ratio = ratio if not pd.isna(ratio) else None
                safe_close = close_price if not pd.isna(close_price) else None
                safe_yield = round(div_yield, 2) if (event_type == "CASH" and not pd.isna(div_yield)) else None

                results.append({
                    "date": row["exright_date"].strftime("%Y-%m-%d"),
                    "title": row.get("event_title"),
                    "type": event_type,
                    "value": safe_val,
                    "ratio": safe_ratio,
                    "price_at_ex": safe_close,
                    "yield_percent": safe_yield
                })
        else:
             # If price history fails, return events without yield info
             for _, row in div_df.iterrows():
                results.append({
                    "date": row["exright_date"].strftime("%Y-%m-%d"),
                    "title": row.get("event_title"),
                    "type": "UNKNOWN",
                    "value": row.get('value'),
                    "ratio": row.get('ratio'),
                    "price_at_ex": None,
                    "yield_percent": None
                })

        # Sort by date descending
        results.sort(key=lambda x: x["date"], reverse=True)
        # results.fillna(0)
        print(f"Fetched {results[0]} dividend events for {symbol}")
        
        return to_jsonable(results)

    except Exception as e:
        print(f"Error fetching dividends for {symbol}: {e}")
        return _err(f"Failed to fetch dividend events: {str(e)}")