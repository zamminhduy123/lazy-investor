"""
Background Task Scheduler
Runs periodic analysis jobs
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.db.session import SessionLocal
from app.workers.news_analyzer import analyze_watchlist_stocks
from app.core.config import settings

# Global scheduler instance
scheduler = AsyncIOScheduler()


async def run_analysis_job():
    """Wrapper to provide DB session"""
    db = SessionLocal()
    try:
        await analyze_watchlist_stocks(db)
    except Exception as e:
        print(f"Background job error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def start_scheduler():
    """
    Start the background scheduler
    
    Jobs:
    - News analysis: Every 4 hours
    - Startup analysis: Run immediately on app start
    """
    
    # Run every hours_between_news_fetch hours
    scheduler.add_job(
        run_analysis_job,
        trigger='interval',
        hours=settings.hours_between_news_fetch,
        id='news_analysis_periodic',
        replace_existing=True,
        max_instances=1  # Prevent overlapping runs
    )
    
    # Also run on specific times (e.g., 8 AM, 12 PM, 4 PM, 8 PM)
    # scheduler.add_job(
    #     run_analysis_job,
    #     trigger=CronTrigger(hour='8,12,16,20'),
    #     id='news_analysis_scheduled',
    #     replace_existing=True
    # )
    
    # Run immediately on startup (after 10 seconds delay)
    scheduler.add_job(
        run_analysis_job,
        trigger='date',
        id='startup_analysis',
        replace_existing=True
    )
    
    scheduler.start()
    print("✓ Background scheduler started")
    print("  - Running every 4 hours")
    print("  - Starting initial analysis in 10 seconds...")


def stop_scheduler():
    """Stop the background scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        print("✓ Background scheduler stopped")


def get_scheduler_status():
    """Get current scheduler status and jobs"""
    jobs = scheduler.get_jobs()
    return {
        "running": scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            }
            for job in jobs
        ]
    }
