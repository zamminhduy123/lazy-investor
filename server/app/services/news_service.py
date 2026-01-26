from __future__ import annotations

from typing import Any, Dict, List, Optional

import feedparser
from vnstock import Company

from app.utils.stock_utils import to_jsonable


def _ok(payload: Dict[str, Any]) -> Dict[str, Any]:
	payload.setdefault("status", "ok")
	return to_jsonable(payload)


def _no_data(payload: Dict[str, Any], message: str) -> Dict[str, Any]:
	payload.setdefault("status", "no_data")
	payload.setdefault("message", message)
	return to_jsonable(payload)


def _err(message: str, **extra: Any) -> Dict[str, Any]:
	payload: Dict[str, Any] = {"error": message}
	payload.update(extra)
	return to_jsonable(payload)


def _parse_google_news_rss(symbol: str, limit: int = 5, lang: str = "vi") -> List[Dict[str, Any]]:
	"""Fetch free news using Google News RSS.

	Notes:
	- RSS contains redirect links; FE can open the link, or you can add a resolver later.
	- We keep payload minimal and JSON-safe.
	"""

	# Query: ticker + "cổ phiếu" to bias toward stock-related results
	rss_url = (
		f"https://news.google.com/rss/search?q={symbol}+cổ+phiếu"
		f"&hl={lang}&gl=VN&ceid=VN:{lang}"
	)
	feed = feedparser.parse(rss_url)

	items: List[Dict[str, Any]] = []
	for entry in getattr(feed, "entries", [])[: max(0, int(limit))]:
		items.append(
			{
				"title": getattr(entry, "title", None),
				"link": getattr(entry, "link", None),
				"published": getattr(entry, "published", None),
				"source": "google_news_rss",
			}
		)
	return items


from datetime import datetime, date
from app.db.session import SessionLocal
from app.db.models import StockNews


def save_news_to_db(symbol: str, news_list: List[Dict[str, Any]]):
    db = SessionLocal()
    try:
        today = date.today()
        for item in news_list:
            link_val = item.get('link') or item.get('news_link') or ""
            if not link_val: continue
            
            # Simple deduplication by link
            existing = db.query(StockNews).filter(StockNews.news_link == link_val).first()
            if not existing:
                # Try to parse published date usually comes as string, but for now store string in title or new field? Do we need to parse?
                # For this simple requirement, we just want to know we fetched it today or it belongs to "today".
                # The model expects DateTime for `published`.
                pub_date = None
                # ... date parsing logic ...
                # skipping complex parsing for now, user just says "in that day". 
                # We will set `fetched_at` to today.
                
                db_news = StockNews(
                    id=item.get('id'),
                    symbol=symbol,
                    news_title=item.get('news_title') or item.get('title'),
                    news_link=link_val,
                    source=item.get('source'),
                    fetched_at=today,
                    news_pub_date=item.get('news_pub_date') or item.get('public_date') or item.get('published'),
                    news_image_url=item.get('news_image_url') or item.get('imageUrl'),
                    ref_price=item.get('ref_price'),
                    price_change_pct=item.get('price_change_pct'),
                    public_date=item.get('published_at'),
                )
                db.add(db_news)
        db.commit()
    except Exception as e:
        print(f"Error saving news: {e}")
        db.rollback()
    finally:
        db.close()

def get_news_from_db(symbol: str) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        today = date.today()
        print(f"Checking news cache for {symbol} on {today}")
        results = db.query(StockNews).filter(
            StockNews.symbol == symbol,
            StockNews.fetched_at == today 
        ).all()

        data = []
        for news in results:
            data.append(
                {
                    "id": news.id,
                    "title": news.news_title,
                    "news_title": news.news_title,
                    "link": news.news_link,
                    "news_link": news.news_link,
                    "public_date": news.public_date,
                    "source": news.source,
                    "news_image_url": news.news_image_url,
                    "ref_price": news.ref_price,
                    "price_change_pct": news.price_change_pct
                }
            )
        return data
    finally:
        db.close()


def get_company_news(
	symbol: str,
	limit: int = 5,
	source: str = "VCI",
	fallback_to_google: bool = True,
) -> Dict[str, Any]:
	"""Get news related to a stock/company.

	Contract (mirrors other services):
	- Returns {status, symbol, data, count} on success
	- Returns {status: 'no_data', ...} when nothing is found
	- Returns {error: '...'} on failure
	"""

	symbol_u = symbol.upper().strip()
	if not symbol_u:
		return _err("symbol is required")

	# 0) Try DB Cache for today
	db_news = get_news_from_db(symbol_u)
	if db_news and len(db_news) > 0:
		print(f"  > News cache hit for {symbol_u}, {len(db_news)} items.")
		return _ok({"symbol": symbol_u, "data": db_news, "count": len(db_news)})

	# 1) Try vnstock Company.news() first
	try:
		company = Company(symbol=symbol_u, source=source)
		df = company.news()
		if getattr(df, "empty", True) or len(df) == 0:
			raise ValueError("vnstock returned no news")

		# vnstock returns a DataFrame; convert to list of dicts early
		if hasattr(df, "head"):
			df = df.head(max(0, int(limit)))

		data = to_jsonable(df)
		# Normalize keys a bit (keep original fields but add a unified set when possible)
  
		print(f"  > Fetched {len(data)} news items from vnstock for {symbol_u}.")  
		for item in data:
			if isinstance(item, dict):
				item.setdefault("source", "vnstock")
				# common vnstock column names seen in `news_script.py`
				if "title" not in item and "news_title" in item:
					item["title"] = item.get("news_title")
				if "link" not in item:
					item["link"] = item.get("news_source_link") or item.get("news_link")

		# Save to DB
		save_news_to_db(symbol_u, data)
		
		return _ok({"symbol": symbol_u, "data": data, "count": len(data)})
	except Exception as e:
		# 2) Fallback to Google RSS
		if not fallback_to_google:
			return _err(f"Failed to fetch news: {str(e)}", symbol=symbol_u)

		try:
			items = _parse_google_news_rss(symbol_u, limit=limit)
			if len(items) == 0:
				return _no_data(
					{"symbol": symbol_u, "data": [], "count": 0},
					"No news available.",
				)
			return _ok({"symbol": symbol_u, "data": items, "count": len(items)})
		except Exception as e2:
			return _err(
				f"Failed to fetch news from vnstock and fallback RSS: {str(e2)}",
				symbol=symbol_u,
			)
