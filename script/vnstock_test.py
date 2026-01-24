import os
import json
import re
from pathlib import Path

import feedparser
import pandas as pd
from datetime import datetime, timedelta
from newspaper import Article
from perplexity import Perplexity
from dotenv import load_dotenv
from vnstock import Listing, Quote, Trading

# Load .env file from parent directory (../)
script_dir = Path(__file__).parent
env_path = script_dir.parent / ".env"
load_dotenv(env_path)

# --- CONFIG ---
# register_user(api_key=os.getenv("VN_STOCK_API_KEY"))

# Get your Key: https://www.perplexity.ai/settings/api
MODEL_ID = "sonar"  # Perplexity model (or "sonar-pro" for pro version)
WATCHLIST = ["HPG"]

# Initialize Perplexity client (automatically uses PERPLEXITY_API_KEY from env)
client = Perplexity(api_key=os.getenv("PERPLEXITY_API_KEY"))

# --- MODULE 1: THE FREE DATA (vnstock) ---
def get_market_context(symbol):
    """
    Uses the FREE tier of vnstock to get today's price action.
    This helps the AI understand if the news pushed the stock up or down.
    """
    try:
        # Docs say TCBS is deprecated, prefer VCI or KBS
        quote = Quote(source="vci", symbol=symbol)
        df = quote.history(interval='1D', start=datetime.now().strftime("%Y-%m-%d"), end=datetime.now().strftime("%Y-%m-%d"))
        
        if not df.empty:
            close = df['close'].iloc[-1]
            change = ((close - df['open'].iloc[-1]) / df['open'].iloc[-1]) * 100
            return f"Stock Price Today: {close} (Change: {change:.2f}%)"
        return "Stock Price: Data Unavailable"
    except Exception:
        return "Stock Price: Data Unavailable (API Error)"

# --- MODULE 2: THE "BYPASS" NEWS FETCHER (Google RSS) ---
def get_free_news(symbol):
    """
    Bypasses vnstock_news (Paid) by using Google News RSS feed for the specific ticker.
    """
    # Query: Ticker + "chungkhoan" (stock) to filter out noise
    rss_url = f"https://news.google.com/rss/search?q={symbol}+cổ+phiếu&hl=vi&gl=VN&ceid=VN:vi"
    feed = feedparser.parse(rss_url)
    
    news_items = []
    # Get top 3 freshest articles
    for entry in feed.entries[:3]:
        news_items.append({
            'title': entry.title,
            'link': entry.link,
            'pubDate': entry.published
        })
    return news_items

# --- MODULE 3: THE AI ANALYST ---
def analyze_article(symbol, price_context, title, content):
    prompt = f"""You are a cynical Vietnamese financial assistant.

    Context:
    - Stock: {symbol}
    - {price_context}

    News Article:
    - Title: {title}
    - Content Snippet: {content[:2000]}... (truncated)

    Task:
    Analyze this news. You MUST respond with ONLY valid JSON, no other text before or after.

    Required JSON format:
    {{
        "is_relevant": true/false,
        "sentiment": "Bullish/Bearish/Neutral",
        "tldr": "1 sentence summary in Vietnamese",
        "score": 1-10
    }}

    Output ONLY the JSON object, nothing else."""
    
    try:
        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {
                    "role": "system",
                    "content": "You are a Vietnamese financial assistant. You MUST respond with ONLY valid JSON format. No explanations, no markdown, no code blocks - just pure JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7
        )
        
        # Extract JSON from response (handle cases where response might have extra text)
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON if wrapped in markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Try to parse JSON to validate it
        try:
            json.loads(response_text)
            return response_text
        except json.JSONDecodeError:
            # If parsing fails, try to extract JSON object from the text
            # Find the first { and try to match it with the last }
            start_idx = response_text.find('{')
            if start_idx != -1:
                # Count braces to find matching closing brace
                brace_count = 0
                for i in range(start_idx, len(response_text)):
                    if response_text[i] == '{':
                        brace_count += 1
                    elif response_text[i] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            json_str = response_text[start_idx:i+1]
                            try:
                                json.loads(json_str)  # Validate
                                return json_str
                            except json.JSONDecodeError:
                                pass
            return "{}"
            
    except Exception as e:
        print(f"    x AI Analysis Failed: {e}")
        return "{}"


def get_stock_performance(symbol):
    """
    Calculates 1-Week and 1-Month performance.
    Logic: 
    - 1 Week approx = 5 trading sessions
    - 1 Month approx = 20 trading sessions
    """
    try:
        # Fetch 60 days of history to ensure we have enough trading days (skipping holidays)
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d")
        
        quote = Quote(source="vci", symbol=symbol)
        # Fetch Daily (1D) data
        df = quote.history(start=start_date, end=end_date, interval='1D')
        
        if df.empty or len(df) < 2:
            return {"1W": "N/A", "1M": "N/A"}

        # Get the Latest Close Price (The last row)
        current_price = df['close'].iloc[-1]
        
        # --- CALCULATE 1 WEEK (5 Sessions ago) ---
        # We use -6 because -1 is today, so -6 is 5 days before today
        if len(df) >= 6:
            price_1w = df['close'].iloc[-6]
            pct_1w = ((current_price - price_1w) / price_1w) * 100
            str_1w = f"{pct_1w:+.1f}%" # Formats as +4.2% or -1.5%
        else:
            str_1w = "N/A"

        # --- CALCULATE 1 MONTH (20 Sessions ago) ---
        if len(df) >= 21:
            price_1m = df['close'].iloc[-21]
            pct_1m = ((current_price - price_1m) / price_1m) * 100
            str_1m = f"{pct_1m:+.1f}%"
        else:
            str_1m = "N/A"
            
        return {"1W": str_1w, "1M": str_1m}

    except Exception as e:
        print(f"Error calculating performance for {symbol}: {e}")
        return {"1W": "N/A", "1M": "N/A"}

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print(f"--- 🕵️ LAZY INVESTOR REPORT ({datetime.now().date()}) ---")

    for symbol in WATCHLIST:
        print(f"\nAnalyzing {symbol}...")
        
        # 1. Get Context (Free Tier)
        context = get_market_context(symbol)
        print(f"  > {context}")
        
        # 2. Get News (Free RSS)
        news_list = get_free_news(symbol)
        # print(news_list)
        
        # trading = Trading(source="VCI")
        # quote = Quote(symbol=symbol, source='VCI')

        # symbols = [s.strip().upper() for s in WATCHLIST if s and s.strip()]
        
        # listing = trading.price_board(symbols)['listing']
        # # create a map from symbol to its ref_price row
        # price_board = {row['symbol']: row['ref_price'] for _, row in listing.iterrows()}

        # listing = Listing(source="VCI")
        # all_symbols = listing.symbols_by_exchange()
        # print("Fetched price board:", all_symbols.columns, quote.intraday(symbol=symbol, page_size=10_000, show_log=False).columns, quote.history(interval='1D', start=datetime.now().strftime("%Y-%m-%d"), end=datetime.now().strftime("%Y-%m-%d")))
        
        print(get_stock_performance(symbol))

        
        # for news in news_list:
        #     # 3. Scrape Content
        #     try:
        #         article = Article(news['link'])
        #         article.download()
        #         article.parse()
                
        #         # Skip empty or very short articles
        #         # if len(article.text) < 100: continue
                
        #         # 4. AI Analysis
        #         print(f"  > Reading: {news['title']}...")
        #         ai_json = analyze_article(symbol, context, news['title'], article.text)
        #         print(f"    🤖 AI: {ai_json}")
                
        #     except Exception as e:
        #         print(f"    x Failed to read article: {e}")
        
        