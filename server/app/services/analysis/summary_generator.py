"""
Summary Generator
Handles market summaries and weekly trend analysis
"""

import json
from typing import List, Dict, Any
from perplexity import Perplexity
from app.core.config import settings

# Initialize Perplexity client
client = Perplexity(api_key=settings.PERPLEXITY_API_KEY)
MODEL_ID = "sonar"


def summarize_market_news(symbol: str, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Summarize multiple news articles to give a market overview.
    
    Args:
        symbol: Stock symbol
        articles: List of article dicts with 'title' and 'analysis' keys
    
    Returns:
        Dict with keys: summary, market_sentiment, trend_analysis, confidence_score
    """
    if not articles:
        return {
            "summary": "No news articles to summarize.",
            "market_sentiment": "Neutral",
            "trend_analysis": "",
            "confidence_score": 0
        }

    articles_text = ""
    for idx, art in enumerate(articles[:5]):  # Limit to 5 articles for summary to fit context
        analysis = art.get('analysis')
        tldr = analysis.get('tldr', '') if analysis else ''
        articles_text += f"{idx+1}. {art.get('title')} - {tldr}\n"

    # JSON Schema for Structured Outputs
    schema = {
        "name": "market_summary_v1",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "Comprehensive market summary paragraph in Vietnamese."
                },
                "market_sentiment": {
                    "type": "string",
                    "enum": ["Bullish", "Bearish", "Neutral", "Volatile"]
                },
                "trend_analysis": {
                    "type": "string",
                    "description": "Brief analysis of current narrative based on the news."
                },
                "confidence_score": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 10
                }
            },
            "required": ["summary", "market_sentiment", "trend_analysis", "confidence_score"]
        }
    }

    system_msg = "You are a senior financial analyst assistant. Output purely valid JSON according to schema."

    prompt = f"""
    Stock: {symbol}
    
    Recent News Highlights:
    {articles_text}
    
    Task:
    Provide a brief summary of the overall market sentiment for this stock based on these news.
    Identify any major events or trends.
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_schema", "json_schema": schema},
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Summary Generation Failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "summary": "Unable to generate summary",
            "market_sentiment": "Neutral",
            "trend_analysis": "",
            "confidence_score": 0
        }


def analyze_weekly_trends(symbol: str, articles: List[Any]) -> Dict[str, Any]:
    """
    Analyze weekly trends from a list of AnalyzedArticle ORM objects.
    
    Args:
        symbol: Stock symbol
        articles: List of AnalyzedArticle ORM objects with sentiment, score, published_at, etc.
    
    Returns:
        Dict with keys: trend_direction, key_themes, momentum_shift, outlook
    """
    if len(articles) < 3:
        return {
            "trend_direction": "Insufficient Data",
            "key_themes": [],
            "momentum_shift": "Not enough articles to determine trend",
            "outlook": "Wait for more data"
        }
    
    # Build chronological summary
    articles_text = "\n".join([
        f"{a.published_at.strftime('%Y-%m-%d')}: {a.title} - {a.sentiment} (Score: {a.score})"
        for a in sorted(articles, key=lambda x: x.published_at)
    ])
    
    bullish_count = sum(1 for a in articles if a.sentiment == 'Bullish')
    bearish_count = sum(1 for a in articles if a.sentiment == 'Bearish')
    avg_score = sum(a.score for a in articles if a.score) / len(articles)
    
    schema = {
        "name": "weekly_trend_v1",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "trend_direction": {
                    "type": "string",
                    "enum": ["Improving", "Declining", "Stable", "Volatile"]
                },
                "key_themes": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Top 3-5 recurring themes this week (Vietnamese)"
                },
                "momentum_shift": {
                    "type": "string",
                    "description": "Notable change in sentiment or narrative (Vietnamese, max 300 chars)",
                    "maxLength": 300
                },
                "outlook": {
                    "type": "string",
                    "description": "Forward-looking summary for long-term investors (Vietnamese, max 400 chars)",
                    "maxLength": 400
                }
            },
            "required": ["trend_direction", "key_themes", "momentum_shift", "outlook"]
        }
    }
    
    prompt = f"""
    Stock: {symbol}
    Analysis Period: Past 7 days
    
    Sentiment Distribution:
    - Bullish: {bullish_count} articles
    - Bearish: {bearish_count} articles
    - Neutral: {len(articles) - bullish_count - bearish_count} articles
    - Average Impact Score: {avg_score:.1f}/10
    
    Articles (chronological):
    {articles_text}
    
    Task: 
    Identify weekly trends for LONG-TERM INVESTORS (not day traders).
    Focus on:
    - Recurring themes (product launches, earnings, regulation, partnerships)
    - Momentum shifts (sentiment improving/worsening)
    - Long-term implications (not short-term noise)
    
    Output in Vietnamese, cynical but helpful tone.
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": "You are a long-term investment analyst. Output JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_schema", "json_schema": schema}
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Weekly trend analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "trend_direction": "Unknown",
            "key_themes": [],
            "momentum_shift": "Analysis failed",
            "outlook": str(e)
        }
