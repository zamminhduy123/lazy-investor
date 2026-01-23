from .session import engine
from .base import Base
from .models import StockHistory

# Create all tables
Base.metadata.create_all(bind=engine)
