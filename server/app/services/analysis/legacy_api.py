"""
Legacy API Compatibility
Maintains backward compatibility with existing analyze_stock and analyze_stock_stream APIs
"""

import json
from typing import Dict, Any
from newspaper import Article
from app.services import news_service, stocks_service
from .article_analyzer import analyze_single_article
from .summary_generator import summarize_market_news


def analyze_stock(symbol: str) -> Dict[str, Any]:
    """
    Legacy function for backward compatibility.
    Analyzes stock with latest news (synchronous).
    
    Note: For production, use the background worker instead.
    """
    # 1. Get Context from stocks_service
    context = stocks_service.get_market_context(symbol)
    
    # 2. Get News from news_service
    news_response = news_service.get_company_news(symbol, limit=5)
    news_list = news_response.get('data', [])
    
    analyzed_articles = []
    
    for news in news_list:
        try:
            link = news.get('link') or news.get('news_link')
            title = news.get('title') or news.get('news_title')
            
            if not link:
                continue

            # 3. Scrape Content
            article = Article(link)
            article.download()
            article.parse()
            
            # 4. AI Analysis (Single) - with caching
            analysis = analyze_single_article(symbol, context, title, article.text)
            
            analyzed_articles.append({
                "title": title,
                "link": link,
                "pubDate": news.get('published') or news.get('news_pub_date'),
                "analysis": analysis if analysis else None,
            })
            
        except Exception as e:
            print(f"Failed to read/analyze article {news.get('title')}: {e}")
            analyzed_articles.append({
                "title": news.get('title'),
                "link": news.get('link'),
                "pubDate": news.get('published'),
                "analysis": None
            })
            
    # 5. Summarize all
    summary_data = summarize_market_news(symbol, analyzed_articles)

    return {
        "symbol": symbol,
        "market_context": context,
        "articles": analyzed_articles,
        "overall_summary": summary_data
    }


async def analyze_stock_stream(symbol: str):
    """
    Legacy streaming function for backward compatibility.
    Generator that yields SSE events during the analysis process.
    
    Note: For production, use the background worker + database approach instead.
    """
    def send_event(event_type: str, data: Any):
        """Helper to format SSE events"""
        return f"data: {json.dumps({'type': event_type, 'data': data})}\n\n"
    
    try:
        # Step 1: Get Context
        yield send_event("status", {"message": f"Fetching market context for {symbol}..."})
        context = stocks_service.get_market_context(symbol)
        yield send_event("progress", {"step": 1, "total": 5, "message": "Context loaded"})
        
        # Step 2: Get News
        yield send_event("status", {"message": "Fetching recent news articles..."})
        news_response = news_service.get_company_news(symbol, limit=5)
        news_list = news_response.get('data', [])
        total_articles = len(news_list)
        yield send_event("progress", {
            "step": 2, 
            "total": 5, 
            "message": f"Found {total_articles} articles to analyze"
        })
        
        analyzed_articles = []
        
        # Step 3: Analyze Each Article
        for idx, news in enumerate(news_list):
            try:
                link = news.get('link') or news.get('news_link')
                title = news.get('title') or news.get('news_title')
                
                if not link:
                    continue
                
                yield send_event("status", {
                    "message": f"Analyzing article {idx+1}/{total_articles}: {title[:50]}..."
                })
                
                # Scrape Content
                article = Article(link)
                article.download()
                article.parse()
                
                # AI Analysis (Single) - with caching
                analysis = analyze_single_article(symbol, context, title, article.text)
                
                article_data = {
                    "title": title,
                    "link": link,
                    "pubDate": news.get('published') or news.get('news_pub_date'),
                    "analysis": analysis if analysis else None,
                }
                
                analyzed_articles.append(article_data)
                
                # Stream individual article result
                yield send_event("article_analyzed", {
                    "index": idx,
                    "total": total_articles,
                    "article": article_data
                })
                
            except Exception as e:
                error_article = {
                    "title": news.get('title'),
                    "link": news.get('link'),
                    "pubDate": news.get('published'),
                    "analysis": None,
                    "error": str(e)
                }
                analyzed_articles.append(error_article)
                yield send_event("article_error", {
                    "index": idx,
                    "error": str(e),
                    "article": error_article
                })
        
        yield send_event("progress", {
            "step": 4, 
            "total": 5, 
            "message": "Generating market summary..."
        })
        
        # Step 4: Summarize
        summary_data = summarize_market_news(symbol, analyzed_articles)
        yield send_event("summary_generated", {"summary": summary_data})
        
        # Step 5: Complete
        final_result = {
            "symbol": symbol,
            "market_context": context,
            "articles": analyzed_articles,
            "overall_summary": summary_data
        }
        
        yield send_event("complete", {"result": final_result})
        
    except Exception as e:
        yield send_event("error", {"message": str(e)})
        import traceback
        traceback.print_exc()
