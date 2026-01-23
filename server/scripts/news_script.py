import feedparser
from datetime import datetime
import os
import pandas as pd
from vnstock import Company
from newspaper import Article



def get_news_links(symbol):
    """
    Fetches news metadata using vnstock3.
    """
    try:
        company = Company(symbol=symbol, source='VCI')
        # fetch last 3 articles to keep it quick for testing
        news_df = company.news().head(3)
        return news_df
    except Exception as e:
        print(f"Error fetching news for {symbol}: {e}")
        return pd.DataFrame()

def extract_content(url):
    """
    Scrapes the text from the URL.
    """
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text
    except Exception as e:
        # As a FE dev, you know this fails on SPA sites (React/Vue).
        # If this returns None often, we'll need a Playwright fallback.
        return None

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

# def analyze_news(ticker, title, content):
#     """
#     Uses the new google-genai SDK to summarize.
#     """
#     prompt = f"""
#     You are a cynical, lazy financial analyst. I own stock in {ticker}.
    
#     News Title: {title}
#     News Body: {content}
    
#     Tell me what this means in JSON format:
#     {{
#         "tldr": "One sentence summary in Vietnamese",
#         "sentiment": "Positive/Negative/Neutral",
#         "is_important": true/false (Is this just noise or actual news?),
#         "reasoning": "Why you think so"
#     }}
#     """
    
#     try:
#         response = client.models.generate_content(
#             model=MODEL_ID,
#             contents=prompt,
#             config=types.GenerateContentConfig(
#                 response_mime_type="application/json" # Enforce JSON mode
#             )
#         )
#         return response.text
#     except Exception as e:
#         return f"AI Error: {e}"


# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print(f"--- 🕵️ LAZY INVESTOR REPORT ({datetime.now().date()}) ---")
    
    for symbol in ["HPG"]:
        print(f"\nAnalyzing {symbol}...")
        
        links = get_news_links(symbol)
        print(f"  > Found {links} articles via vnstock.")
        
        for _, link in links.iterrows():
            # 3. Scrape Content
            try:
                content = extract_content(link['news_source_link'])
                
                # Skip empty or very short articles
                # if len(article.text) < 100: continue
                
                # 4. AI Analysis
                print(f"  > Reading: {link['news_title']}...")
                print(f"    > Content: {content[:100]}...")  # Print first 100 chars
                # ai_json = analyze_article(symbol, context, news['title'], article.text)
                # print(f"    🤖 AI: {ai_json}")
                
            except Exception as e:
                print(f"    x Failed to read article: {e}")
        
        # 1. Get Context (Free Tier)
        # context = get_market_context(symbol)
        # print(f"  > {context}")
        
        # 2. Get News (Free RSS)
        news_list = get_free_news(symbol)
        
        for news in news_list:
            # 3. Scrape Content
            try:
                # Skip empty or very short articles
                # if len(article.text) < 100: continue
                
                # 4. AI Analysis
                print(f"  > Reading: {news['title']}...")
                # ai_json = analyze_article(symbol, context, news['title'], article.text)
                # print(f"    🤖 AI: {ai_json}")
                
            except Exception as e:
                print(f"    x Failed to read article: {e}")