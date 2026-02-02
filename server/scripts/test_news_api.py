import argparse
import json
from typing import Any, Dict

import httpx


def fetch_company_news(base_url: str, symbol: str, limit: int) -> Dict[str, Any]:
    url = f"{base_url.rstrip('/')}/api/v1/news/company"
    params = {
        "symbol": symbol,
        "limit": limit,
        "fallbackToGoogle": False,
    }
    response = httpx.get(url, params=params, timeout=30.0)
    response.raise_for_status()
    return response.json()


def main() -> None:
    parser = argparse.ArgumentParser(description="Test News API (DB-only mode)")
    parser.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--symbol", default="HPG", help="Stock symbol to query")
    parser.add_argument("--limit", type=int, default=5, help="Max number of news items")
    parser.add_argument("--raw", action="store_true", help="Print raw JSON response")
    args = parser.parse_args()

    print(f"\n--- Testing News API ---")
    print(f"Base URL: {args.base_url}")
    print(f"Symbol: {args.symbol}")
    print(f"Limit: {args.limit}\n")

    try:
        result = fetch_company_news(args.base_url, args.symbol, args.limit)

        if args.raw:
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return

        status = result.get("status")
        count = result.get("count", 0)
        print(f"Status: {status}")
        print(f"Count: {count}")

        if status == "ok":
            print("\nNews items:")
            for idx, item in enumerate(result.get("data", []), start=1):
                title = item.get("title") or item.get("news_title")
                link = item.get("link") or item.get("news_link")
                published = item.get("public_date") or item.get("news_pub_date")
                print(f"{idx}. {title}")
                print(f"   Link: {link}")
                if published:
                    print(f"   Published: {published}")
        else:
            print(result.get("message", "No news available."))

    except httpx.HTTPStatusError as exc:
        print("HTTP error:")
        print(exc.response.text)
    except Exception as exc:
        print(f"Error: {exc}")


if __name__ == "__main__":
    main()
