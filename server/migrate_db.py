"""
Database Migration Script
Creates new tables and adds initial watchlist stocks
"""

from app.db.base import Base
from app.db.session import engine
from app.db.models import Watchlist
from sqlalchemy.orm import Session

def create_tables():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")

def add_default_watchlist():
    """Add default stocks to watchlist"""
    print("\nAdding default stocks to watchlist...")
    
    db = Session(bind=engine)
    
    default_symbols = ['HPG', 'VNM', 'FPT']
    
    for symbol in default_symbols:
        existing = db.query(Watchlist).filter_by(symbol=symbol, user_id=None).first()
        if not existing:
            watchlist_item = Watchlist(symbol=symbol, user_id=None)
            db.add(watchlist_item)
            print(f"  ✓ Added {symbol}")
        else:
            print(f"  ⏭️  {symbol} already in watchlist")
    
    db.commit()
    db.close()
    print("\n✓ Watchlist setup complete")

if __name__ == "__main__":
    print("="*60)
    print("Stock Me 2 - Database Migration")
    print("="*60)
    
    create_tables()
    add_default_watchlist()
    
    print("\n" + "="*60)
    print("Migration complete!")
    print("="*60)
    print("\nNext steps:")
    print("1. Start the server: uvicorn app.main:app --reload")
    print("2. Background analysis will run automatically")
    print("3. Check /api/v1/analysis/signals/latest for notifications")
    print("\n")
