from typing import Optional, Dict, Any
import requests

class StockQuoteParams:
    def __init__(self, symbol: str, start_date: Optional[str] = None, end_date: Optional[str] = None, interval: Optional[str] = "1D"):
        self.symbol = symbol
        self.start_date = start_date
        self.end_date = end_date
        self.interval = interval

class StockResponse:
    def __init__(self, symbol: Optional[str] = None, symbols: Optional[list] = None, data: Optional[Any] = None, count: Optional[int] = None, error: Optional[str] = None):
        self.symbol = symbol
        self.symbols = symbols
        self.data = data
        self.count = count
        self.error = error

def execute_stock_service(command: str, *args: str) -> StockResponse:
    try:
        url = f"http://localhost:8000/api/v1/stocks/{command}"
        response = requests.get(url, params={"args": args})
        response.raise_for_status()
        return StockResponse(data=response.json())
    except requests.RequestException as e:
        return StockResponse(error=str(e))

def get_stock_quote(params: StockQuoteParams) -> StockResponse:
    return execute_stock_service("quote", params.symbol, params.start_date, params.end_date, params.interval)

def get_stock_intraday(symbol: str) -> StockResponse:
    return execute_stock_service("intraday", symbol)

def get_stock_price_depth(symbol: str) -> StockResponse:
    return execute_stock_service("price_depth", symbol)

def get_company_info(symbol: str) -> StockResponse:
    return execute_stock_service("company", symbol)

def get_company_shareholders(symbol: str) -> StockResponse:
    return execute_stock_service("shareholders", symbol)

def get_price_board(symbols: list) -> StockResponse:
    return execute_stock_service("price_board", ",".join(symbols))

def get_all_symbols() -> StockResponse:
    return execute_stock_service("all_symbols")

def get_indices() -> StockResponse:
    return execute_stock_service("indices")




def to_jsonable(obj: Any) -> Any:
    """
    Convert common vnstock/pandas/numpy objects to JSON-serializable Python types.
    Keeps dict/list primitives intact.
    """
    if obj is None:
        return None

    # Primitive JSON types
    if isinstance(obj, (str, int, float, bool)):
        return obj

    # Dict
    if isinstance(obj, dict):
        return {str(k): to_jsonable(v) for k, v in obj.items()}

    # List/tuple/set
    if isinstance(obj, (list, tuple, set)):
        return [to_jsonable(v) for v in obj]

    # Pandas DataFrame / Series
    try:
        import pandas as pd  # type: ignore
        if isinstance(obj, pd.DataFrame):
            return obj.to_dict(orient="records")
        if isinstance(obj, pd.Series):
            # Series might contain numpy types; normalize values too
            return to_jsonable(obj.to_dict())
    except Exception:
        pass

    # NumPy scalar / array
    try:
        import numpy as np  # type: ignore
        if isinstance(obj, np.generic):
            return obj.item()
        if isinstance(obj, np.ndarray):
            return to_jsonable(obj.tolist())
    except Exception:
        pass

    # datetime-like (datetime/date) or pandas Timestamp
    try:
        import datetime as dt
        if isinstance(obj, (dt.datetime, dt.date)):
            return obj.isoformat()
    except Exception:
        pass

    # Fallback: string representation
    return str(obj)


def normalize_service_response(resp: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure the whole service response is JSON serializable.
    """
    return to_jsonable(resp)