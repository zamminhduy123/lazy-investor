# Rate Limiting Documentation

## Overview

The background worker implements rate limiting to respect vnstock's API limits of **20 requests per minute**.

## Implementation

### Rate Limiter Class

Located in `app/workers/news_analyzer.py`:

```python
class RateLimiter:
    def __init__(self, max_requests: int = 20, time_window: int = 60):
        """
        Args:
            max_requests: Maximum requests allowed (default: 20)
            time_window: Time window in seconds (default: 60)
        """
```

### How It Works

1. **Request Tracking**: Each API call timestamp is stored in a deque
2. **Window Cleanup**: Removes requests older than 60 seconds
3. **Limit Check**: If 20 requests in last 60s, calculates wait time
4. **Auto-Wait**: Automatically sleeps until oldest request expires
5. **Safety Margin**: Adds 1 second buffer to avoid edge cases

### Usage in Worker

The rate limiter is called before each vnstock API request:

```python
# Before fetching news
vnstock_rate_limiter.wait_if_needed()
news_response = news_service.get_company_news(symbol, limit=20)

# Before fetching market context
vnstock_rate_limiter.wait_if_needed()
context = stocks_service.get_market_context(symbol)
```

## Monitoring

### Check Rate Limiter Status

**Endpoint:** `GET /api/v1/analysis/status`

**Response:**
```json
{
  "status": "operational",
  "rate_limiter": {
    "requests_in_window": 15,
    "max_requests": 20,
    "time_window": 60,
    "remaining": 5,
    "status": "healthy",
    "warning": null
  }
}
```

### Status Indicators

- **healthy**: More than 5 requests remaining
- **near_limit**: 5 or fewer requests remaining
- **warning**: Message when approaching limit

### Logs

During background job execution:

```
📊 Rate Limiter: 15/20 requests in last 60s
   Remaining: 5 requests available

⏳ Rate limit reached (20 requests/minute). Waiting 23.4s...
```

## Performance Impact

### Best Case
- **8 stocks** in watchlist
- **2 API calls per stock** (news + context)
- **16 total calls** → No waiting needed
- **Execution time:** ~2-3 minutes (network + AI analysis)

### Worst Case
- **20+ stocks** in watchlist
- **40+ API calls needed**
- **2 batches** of 20 requests
- **Wait time:** ~60 seconds between batches
- **Execution time:** ~5-8 minutes

## Optimization Strategies

### 1. Caching (Already Implemented)
- Market context could be cached per symbol
- News responses cached in database
- Reduces duplicate API calls

### 2. Batch Processing
Current implementation processes stocks sequentially:
```
Stock 1 → API call → wait → Stock 2 → API call → wait...
```

### 3. Smart Scheduling
- Run analysis during off-peak hours
- Stagger analysis for different stock groups
- Prioritize high-priority stocks

### 4. Request Pooling
Group API calls to maximize efficiency within rate limit.

## Configuration

### Adjust Rate Limits

In `app/workers/news_analyzer.py`:

```python
# Default: 20 requests per 60 seconds
vnstock_rate_limiter = RateLimiter(max_requests=20, time_window=60)

# Conservative: 15 requests per 60 seconds (more headroom)
vnstock_rate_limiter = RateLimiter(max_requests=15, time_window=60)

# Aggressive: 19 requests per 55 seconds (use buffer)
vnstock_rate_limiter = RateLimiter(max_requests=19, time_window=55)
```

### Adjust Analysis Frequency

In `app/workers/__init__.py`:

```python
# Current: Every 4 hours
scheduler.add_job(run_analysis_job, trigger='interval', hours=4)

# More frequent: Every 2 hours (recommended for < 10 stocks)
scheduler.add_job(run_analysis_job, trigger='interval', hours=2)

# Less frequent: Every 6 hours (for many stocks)
scheduler.add_job(run_analysis_job, trigger='interval', hours=6)
```

## Troubleshooting

### Issue: Analysis Taking Too Long

**Cause:** Too many stocks in watchlist, hitting rate limits frequently

**Solutions:**
1. Reduce watchlist size
2. Increase analysis interval (4h → 6h)
3. Split watchlist into priority tiers

### Issue: Rate Limit Errors

**Cause:** Manual API calls + background job competing

**Solutions:**
1. Check `/api/v1/analysis/status` for current usage
2. Temporarily disable background job
3. Implement request prioritization

### Issue: Watchlist Not Updating

**Cause:** Rate limiter preventing API calls

**Check logs:**
```bash
# Look for rate limit warnings
grep "Rate limit" server_logs.txt

# Check scheduler status
curl http://localhost:8000/api/v1/analysis/status
```

## API Rate Limit Details

### vnstock Library Limits

- **Official Limit:** 20 requests per minute
- **Enforcement:** Server-side (may return errors if exceeded)
- **Penalty:** Temporary block (duration varies)

### Our Implementation

- **Proactive:** Waits before hitting limit
- **Safe:** Adds 1-second buffer
- **Monitored:** Tracks usage in real-time
- **Logged:** Shows wait times and statistics

## Examples

### Scenario 1: Small Watchlist (5 stocks)

```
[10:00:00] Starting watchlist analysis...
📊 Rate Limiter: 0/20 requests in last 60s
📋 Monitoring 5 stocks: HPG, VNM, VCB, FPT, VIC

[1/5] Processing HPG...
  API Call 1: get_company_news (remaining: 19)
  API Call 2: get_market_context (remaining: 18)

[2/5] Processing VNM...
  API Call 3: get_company_news (remaining: 17)
  API Call 4: get_market_context (remaining: 16)

... continues without waiting ...

[10:03:00] Completed (10 API calls, no delays)
```

### Scenario 2: Large Watchlist (15 stocks)

```
[10:00:00] Starting watchlist analysis...
📊 Rate Limiter: 0/20 requests in last 60s
📋 Monitoring 15 stocks: HPG, VNM, VCB... (15 total)

[1-10] Processing first 10 stocks...
  20 API calls made (remaining: 0)

[11/15] Processing MWG...
⏳ Rate limit reached (20 requests/minute). Waiting 42.3s...

[10:01:42] Resuming...
  API Call 21: get_company_news (remaining: 19)
  
... continues with remaining stocks ...

[10:04:30] Completed (30 API calls, 42s delay)
```

## Future Improvements

### 1. Distributed Rate Limiting
For multiple server instances, use Redis:

```python
from redis import Redis
from datetime import datetime

class RedisRateLimiter:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.key = "vnstock:rate_limit"
    
    def wait_if_needed(self):
        count = self.redis.incr(self.key)
        if count == 1:
            self.redis.expire(self.key, 60)
        
        if count > 20:
            ttl = self.redis.ttl(self.key)
            time.sleep(ttl + 1)
            return self.wait_if_needed()
```

### 2. Priority Queue
Prioritize high-value stocks:

```python
priority_stocks = ['VNM', 'HPG']  # Analyze these first
regular_stocks = [...]  # Analyze after priority

for stock in priority_stocks:
    analyze_symbol_news(db, stock)

# Check if we have budget left
if vnstock_rate_limiter.get_stats()['remaining'] > 5:
    for stock in regular_stocks:
        analyze_symbol_news(db, stock)
```

### 3. Adaptive Throttling
Adjust based on API response times:

```python
class AdaptiveRateLimiter(RateLimiter):
    def adjust_limit(self, error_rate: float):
        if error_rate > 0.1:  # 10% errors
            self.max_requests = max(10, self.max_requests - 2)
        elif error_rate == 0:
            self.max_requests = min(20, self.max_requests + 1)
```

---

## Summary

✅ **Implemented:** Automatic rate limiting with 20 req/min  
✅ **Monitored:** Real-time stats via `/analysis/status` API  
✅ **Logged:** Clear console output with wait times  
✅ **Safe:** 1-second buffer to avoid edge cases  
✅ **Scalable:** Handles 5-50+ stocks with automatic throttling  

The rate limiter ensures reliable, compliant API usage while maximizing throughput within vnstock's constraints.
