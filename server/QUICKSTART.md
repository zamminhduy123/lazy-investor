# Quick Start Guide

## ✅ Setup Complete!

The analysis service has been successfully refactored with background job architecture.

---

## What Just Happened

### 1. **New Folder Structure**
```
server/app/
├── services/analysis/     # Modular AI analysis
│   ├── article_analyzer.py
│   ├── summary_generator.py
│   └── legacy_api.py
├── workers/               # Background jobs
│   ├── __init__.py        # Scheduler
│   └── news_analyzer.py   # Analysis worker
└── db/models.py           # 4 new tables added
```

### 2. **Database Tables Created**
- ✅ `analyzed_articles` - AI-analyzed news
- ✅ `weekly_summaries` - Weekly trend analysis  
- ✅ `signals` - Investment alerts
- ✅ `watchlist` - Stocks to monitor (8 stocks added)

### 3. **Background Worker Configured**
- Runs every 4 hours automatically
- Analyzes news for HPG, VNM, VCB, FPT, VIC, MSN, MWG, GAS
- Detects dividend/earnings signals
- Generates weekly summaries

---

## Start the Server

```bash
cd server
uvicorn app.main:app --reload
```

**Expected output:**
```
🚀 Starting Stock Me 2 API...
✓ Background scheduler started
  - Running every 4 hours
  - Starting initial analysis in 10 seconds...
✓ API ready

INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## Test the API

### 1. Wait for Initial Analysis (~1 min)

The background job will start automatically after 10 seconds. Watch the logs:

```
============================================================
[2026-01-31 10:00:00] Starting watchlist analysis...
============================================================

📋 Monitoring 8 stocks: HPG, VNM, VCB, FPT, VIC, MSN, MWG, GAS

📊 Analyzing HPG...
----------------------------------------
📰 HPG: Found 3 new articles to analyze

  [1/3] HPG công bố lợi nhuận quý 4 tăng 25%...
      ✓ 📈 Bullish (Score: 8/10)
  🚨 Signal: 📈 HPG: Strong Earnings Signal
  ✓ Weekly summary updated: Improving (Avg score: 7.2/10)
```

### 2. Test Instant Analysis

```bash
# Get pre-analyzed data (INSTANT!)
curl http://localhost:8000/api/v1/analysis/HPG
```

**Response:**
```json
{
  "symbol": "HPG",
  "articles": [
    {
      "title": "HPG công bố lợi nhuận...",
      "analysis": {
        "sentiment": "Bullish",
        "score": 8,
        "tldr": "...",
        "key_drivers": ["..."],
        "risks_or_caveats": ["..."]
      }
    }
  ],
  "overall_summary": {
    "market_sentiment": "Improving",
    "summary": "...",
    "confidence_score": 7
  }
}
```

### 3. Check Signals

```bash
curl http://localhost:8000/api/v1/analysis/signals/latest
```

**Response:**
```json
{
  "signals": [
    {
      "id": 1,
      "symbol": "HPG",
      "type": "earnings_beat",
      "priority": "high",
      "title": "📈 HPG: Strong Earnings Signal",
      "description": "HPG công bố lợi nhuận quý 4 tăng 25%...",
      "detected_at": "2026-01-31T10:00:00"
    }
  ]
}
```

### 4. Get Weekly Trends

```bash
curl http://localhost:8000/api/v1/analysis/HPG/weekly
```

**Response:**
```json
{
  "symbol": "HPG",
  "week_start": "2026-01-27",
  "sentiment_distribution": {
    "bullish": 7,
    "bearish": 2,
    "neutral": 3
  },
  "trend_direction": "Improving",
  "key_themes": [
    "Steel demand increasing",
    "Export growth",
    "Infrastructure projects"
  ],
  "outlook": "Long-term positive outlook..."
}
```

---

## Frontend Integration

**No changes needed!** The API contract is backward compatible.

Your existing React hooks will work but now get **instant** responses instead of 30s waits:

```typescript
// This hook still works, but now INSTANT!
const { data } = useQuery({
  queryKey: ['analysis', symbol],
  queryFn: () => fetch(`/api/v1/analysis/${symbol}`).then(r => r.json())
});
```

### Optional: Add Signal Notifications

```typescript
// New hook for investment signals
export function useSignals() {
  return useQuery({
    queryKey: ['signals'],
    queryFn: () => 
      fetch('/api/v1/analysis/signals/latest?unread_only=true')
        .then(r => r.json()),
    refetchInterval: 60000 // Check every minute
  });
}
```

---

## Add More Stocks

```sql
-- Add stocks to watchlist
INSERT INTO watchlist (symbol) VALUES 
    ('VHM'),
    ('VRE'),
    ('TCB');
```

Or via Python:

```python
from app.db.session import SessionLocal
from app.db.models import Watchlist

db = SessionLocal()
db.add(Watchlist(symbol='VHM'))
db.add(Watchlist(symbol='VRE'))
db.commit()
```

---

## Customize Schedule

Edit `app/workers/__init__.py`:

```python
# Change from every 4 hours to every 2 hours
scheduler.add_job(
    run_analysis_job,
    trigger='interval',
    hours=2,  # Changed from 4
    id='news_analysis_periodic'
)

# Or run at specific times (8 AM, 12 PM, 4 PM, 8 PM)
from apscheduler.triggers.cron import CronTrigger
scheduler.add_job(
    run_analysis_job,
    trigger=CronTrigger(hour='8,12,16,20'),
    id='scheduled_analysis'
)
```

---

## Monitor Performance

### Check Database

```bash
sqlite3 stock_database.db

# Count analyzed articles
SELECT symbol, COUNT(*) FROM analyzed_articles GROUP BY symbol;

# Recent signals
SELECT * FROM signals WHERE is_read = 0 ORDER BY detected_at DESC LIMIT 10;

# Weekly summaries
SELECT symbol, trend_direction, avg_score FROM weekly_summaries;
```

### Check Scheduler Status

Add this endpoint to `analysis.py`:

```python
from app.workers import get_scheduler_status

@router.get("/status")
def get_status():
    return get_scheduler_status()
```

Then:
```bash
curl http://localhost:8000/api/v1/analysis/status
```

---

## Troubleshooting

### No data returned

**Cause:** Background job hasn't run yet (waits 10s on startup)

**Solution:** Wait 1-2 minutes for first analysis to complete

### Articles not being analyzed

**Check logs** for errors during scraping:
```
❌ Failed: HTTP 403 Forbidden
```

Some news sites block scrapers. This is expected.

### Background job not running

**Restart server** to trigger startup job:
```bash
# Ctrl+C to stop
uvicorn app.main:app --reload
```

---

## Production Deployment

### 1. Use PostgreSQL (not SQLite)

Update `app/db/session.py`:
```python
DATABASE_URL = "postgresql://user:password@host:5432/dbname"
```

### 2. Environment Variables

Create `.env`:
```bash
PERPLEXITY_API_KEY=your_key_here
DATABASE_URL=postgresql://...
```

### 3. Deploy to Railway/Render

Both support background workers with APScheduler (no additional config needed).

---

## Next Steps

1. ✅ Test all API endpoints
2. ✅ Verify background job runs every 4 hours
3. [ ] Add email notifications for high-priority signals
4. [ ] Implement user-specific watchlists
5. [ ] Deploy to production

---

## Documentation

- **Full Architecture:** See `app/services/analysis/README.md`
- **Migration Summary:** See `ANALYSIS_SERVICE_REFACTORING.md`
- **API Docs:** Visit http://localhost:8000/docs (Swagger UI)

---

## Questions?

The system is now ready for long-term investment intelligence!

**Key Benefits:**
- ✅ Instant API responses (no 30s AI wait)
- ✅ Automatic monitoring of 8 Vietnamese stocks
- ✅ Weekly trend analysis with themes
- ✅ Proactive dividend/earnings signals
- ✅ Historical data for all analyses

Enjoy! 🚀
