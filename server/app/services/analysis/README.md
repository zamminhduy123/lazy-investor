# Stock Me 2 - Analysis Service Architecture

## Overview

The analysis service has been restructured into a **background job architecture** for better performance and scalability. Instead of analyzing news on-demand (slow), the system now:

1. **Continuously fetches** news every 4 hours
2. **Pre-analyzes** with AI in the background  
3. **Stores results** in PostgreSQL
4. **Serves instantly** from database

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Background Worker (APScheduler)        │
│  • Runs every 4 hours                   │
│  • Fetches news for watchlist stocks    │
│  • Analyzes with AI                     │
│  • Stores in PostgreSQL                 │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Database (PostgreSQL)                  │
│  • analyzed_articles                    │
│  • weekly_summaries                     │
│  • signals                              │
│  • watchlist                            │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  FastAPI                                │
│  GET /analysis/{symbol} → Instant!      │
│  GET /signals/latest → Notifications    │
│  GET /{symbol}/weekly → Trend analysis  │
└─────────────────────────────────────────┘
```

---

## Folder Structure

```
server/
├── app/
│   ├── services/
│   │   └── analysis/              # NEW: Modular analysis service
│   │       ├── __init__.py        # Public API
│   │       ├── article_analyzer.py # Single article analysis + caching
│   │       ├── summary_generator.py # Market summaries + weekly trends
│   │       └── legacy_api.py      # Backward compatibility
│   │
│   ├── workers/                   # NEW: Background jobs
│   │   ├── __init__.py            # Scheduler setup
│   │   └── news_analyzer.py      # Main analysis worker
│   │
│   ├── db/
│   │   └── models.py              # UPDATED: New tables added
│   │       • AnalyzedArticle
│   │       • WeeklySummary
│   │       • Signal
│   │       • Watchlist
│   │
│   └── api/v1/routes/
│       └── analysis.py            # UPDATED: New endpoints
```

---

## Database Schema

### `analyzed_articles`
Stores AI-analyzed news with sentiment, score, key drivers, risks.

```sql
CREATE TABLE analyzed_articles (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10),
    title TEXT,
    link TEXT,
    published_at TIMESTAMP,
    analyzed_at TIMESTAMP,
    
    -- AI Results
    is_relevant BOOLEAN,
    sentiment VARCHAR(20),  -- Bullish/Bearish/Neutral
    tldr TEXT,
    rationale TEXT,
    key_drivers JSONB,
    risks_or_caveats JSONB,
    score INTEGER,  -- 1-10 impact
    confidence FLOAT,
    
    UNIQUE(symbol, title, published_at)
);
```

### `weekly_summaries`
Aggregated weekly trend analysis with themes and outlook.

```sql
CREATE TABLE weekly_summaries (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10),
    week_start DATE,
    week_end DATE,
    
    -- Metrics
    total_articles INTEGER,
    bullish_count INTEGER,
    bearish_count INTEGER,
    avg_score FLOAT,
    
    -- AI Insights
    trend_direction VARCHAR(20),  -- Improving/Declining/Stable/Volatile
    key_themes JSONB,
    momentum_shift TEXT,
    outlook TEXT,
    
    UNIQUE(symbol, week_start)
);
```

### `signals`
Investment signals (dividend announcements, earnings, major contracts).

```sql
CREATE TABLE signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10),
    signal_type VARCHAR(50),  -- dividend_announced, earnings_beat, etc.
    priority VARCHAR(20),  -- high/medium/low
    title TEXT,
    description TEXT,
    detected_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_read BOOLEAN,
    article_id INTEGER
);
```

### `watchlist`
Stocks to monitor for background analysis.

```sql
CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    symbol VARCHAR(10),
    added_at TIMESTAMP,
    UNIQUE(user_id, symbol)
);
```

---

## API Endpoints

### Analysis (Updated)

#### `GET /api/v1/analysis/{symbol}`
**Instant** pre-analyzed data from database (no AI wait!)

```json
{
  "symbol": "HPG",
  "articles": [
    {
      "title": "...",
      "link": "...",
      "pubDate": "2026-01-31T10:00:00",
      "analysis": {
        "sentiment": "Bullish",
        "tldr": "...",
        "score": 8,
        "key_drivers": ["..."],
        "risks_or_caveats": ["..."]
      }
    }
  ],
  "overall_summary": {
    "market_sentiment": "Improving",
    "summary": "...",
    "trend_analysis": "...",
    "confidence_score": 7
  }
}
```

#### `GET /api/v1/analysis/{symbol}/stream`
Legacy streaming endpoint (slow, on-demand analysis). Use for testing only.

---

### Signals (New)

#### `GET /api/v1/analysis/signals/latest`
Get investment signals (auto-detected from news).

```json
{
  "signals": [
    {
      "id": 1,
      "symbol": "VNM",
      "type": "dividend_announced",
      "priority": "high",
      "title": "💰 VNM: Dividend Announcement",
      "description": "VNM announces 15% dividend...",
      "detected_at": "2026-01-31T08:00:00"
    }
  ]
}
```

#### `POST /api/v1/analysis/signals/{signal_id}/mark_read`
Mark a signal as read.

---

### Weekly Trends (New)

#### `GET /api/v1/analysis/{symbol}/weekly`
Get weekly trend summary with themes and outlook.

```json
{
  "symbol": "HPG",
  "week_start": "2026-01-27",
  "week_end": "2026-02-02",
  "total_articles": 12,
  "sentiment_distribution": {
    "bullish": 7,
    "bearish": 3,
    "neutral": 2
  },
  "avg_score": 6.5,
  "trend_direction": "Improving",
  "key_themes": [
    "Steel demand increasing",
    "Infrastructure projects",
    "Export growth"
  ],
  "momentum_shift": "Sentiment improving vs last week...",
  "outlook": "Long-term outlook positive based on..."
}
```

---

## Setup & Migration

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Run Database Migrations

The new tables will be created automatically when you start the server.

If you need to manually create tables:

```bash
python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
```

### 3. Add Stocks to Watchlist

```sql
-- Add stocks you want to monitor
INSERT INTO watchlist (symbol) VALUES 
    ('HPG'),
    ('VNM'),
    ('VCB'),
    ('FPT');
```

### 4. Start the Server

```bash
uvicorn app.main:app --reload
```

The background worker will:
- Start automatically on server startup
- Run initial analysis after 10 seconds
- Run every 4 hours thereafter

---

## Background Worker

### Scheduler Configuration

Located in `app/workers/__init__.py`:

```python
# Run every 4 hours
scheduler.add_job(
    run_analysis_job,
    trigger='interval',
    hours=4,
    id='news_analysis_periodic'
)

# Run on startup (after 10s delay)
scheduler.add_job(
    run_analysis_job,
    trigger='date',
    id='startup_analysis'
)
```

### Custom Schedule

To run at specific times (e.g., 8 AM, 12 PM, 4 PM, 8 PM):

```python
from apscheduler.triggers.cron import CronTrigger

scheduler.add_job(
    run_analysis_job,
    trigger=CronTrigger(hour='8,12,16,20'),
    id='news_analysis_scheduled'
)
```

---

## Caching Strategy

### Level 1: Article Analysis Cache (In-Memory)
- **Purpose**: Avoid re-analyzing same article title
- **TTL**: 1 hour
- **Storage**: In-memory dict with MD5 hash keys
- **Location**: `app/services/analysis/article_analyzer.py`

```python
# Cache key: hash(symbol + title)
_analysis_cache.get(symbol, title)
```

### Level 2: Database (Permanent)
- **Purpose**: Persistent storage of all analyzed articles
- **TTL**: Infinite (historical record)
- **Deduplication**: `UNIQUE(symbol, title, published_at)`

---

## Signal Detection

Signals are auto-detected based on keywords and sentiment:

### Dividend Signals
- Keywords: `cổ tức`, `dividend`, `phân phối`, `chia cổ`
- Condition: `score >= 6`
- Priority: `high` if `score >= 8`, else `medium`

### Earnings Signals
- Keywords: `doanh thu`, `lợi nhuận`, `kết quả kinh doanh`, `earnings`
- Condition: `sentiment == 'Bullish' AND score >= 7`
- Priority: `high`

### Contract Signals
- Keywords: `hợp đồng`, `dự án`, `contract`, `partnership`
- Condition: `sentiment == 'Bullish' AND score >= 7`
- Priority: `medium`

Add more signal types in `app/workers/news_analyzer.py:detect_signals()`.

---

## Benefits

✅ **Instant Load**: No 30s AI wait, data served from DB  
✅ **Cost Efficient**: Analyze each article once, serve forever  
✅ **Historical Data**: Build knowledge base of past analyses  
✅ **Better Insights**: Weekly/monthly trend detection  
✅ **Proactive Alerts**: Signals for dividends, earnings, etc.  
✅ **Scalable**: Monitor 100+ stocks automatically  

---

## Migration from Old System

Old code is preserved in `legacy_api.py` for backward compatibility:

```python
# Old (still works, but slow)
from app.services.analysis import analyze_stock, analyze_stock_stream

# New (instant, from DB)
db.query(AnalyzedArticle).filter_by(symbol="HPG")...
```

The `/stream` endpoint still works for testing, but production should use the instant DB endpoint.

---

## Monitoring

### Check Scheduler Status

Add this endpoint to `analysis.py`:

```python
from app.workers import get_scheduler_status

@router.get("/status")
def get_analysis_status():
    return get_scheduler_status()
```

### Logs

Background job logs will show:
```
[2026-01-31 10:00:00] Starting watchlist analysis...
📋 Monitoring 4 stocks: HPG, VNM, VCB, FPT

📊 Analyzing HPG...
📰 HPG: Found 3 new articles to analyze
  [1/3] HPG công bố lợi nhuận quý 4 tăng 25%...
      ✓ 📈 Bullish (Score: 8/10)
  🚨 Signal: 📈 HPG: Strong Earnings Signal
  ✓ Weekly summary updated: Improving (Avg score: 7.2/10)
```

---

## Next Steps

1. **Add more stocks** to watchlist
2. **Customize signal detection** rules
3. **Set up email/Telegram notifications** for high-priority signals
4. **Add user-specific watchlists** (multi-user support)
5. **Deploy with production database** (PostgreSQL on Railway/Render)
6. **Set up Redis cache** for even faster API responses

---

## Troubleshooting

### No data returned from `/analysis/{symbol}`

**Cause**: Stock not in watchlist or background job hasn't run yet.

**Solution**:
```sql
-- Add to watchlist
INSERT INTO watchlist (symbol) VALUES ('HPG');

-- Manually trigger analysis
-- Restart server to run startup job
```

### Background job not running

**Check logs** for scheduler errors:
```python
from app.workers import get_scheduler_status
# Should show running: true, jobs: [...]
```

### Articles not being analyzed

**Check deduplication**: Same article won't be re-analyzed.

**Check time filter**: Only articles from past 6 hours are processed.

```python
# In news_analyzer.py, adjust cutoff_time
cutoff_time = datetime.now() - timedelta(hours=24)  # Increase to 24 hours
```
