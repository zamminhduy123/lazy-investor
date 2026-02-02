from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1 import api_router
import app.db  # Initialize DB and create tables
from app.core.config import settings
from app.workers import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    print("\n🚀 Starting Stock Me 2 API...")
    start_scheduler()
    print("✓ API ready\n")
    
    yield
    
    # Shutdown
    print("\n👋 Shutting down...")
    stop_scheduler()
    print("✓ Cleanup complete\n")


app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    description="API for Stock Me 2 - RAG & Analysis",
    lifespan=lifespan
)

# --- CORS CONFIGURATION ---
origins = [
    "http://localhost:5173",  # Client (Vite)
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # <--- Correct argument name
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Stock API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)