from fastapi import APIRouter

from app.api.v1.routes.stocks import router as stocks_router
from app.api.v1.routes.news import router as news_router
from app.api.v1.routes.analysis import router as analysis_router

api_router = APIRouter()
api_router.include_router(stocks_router)
api_router.include_router(news_router)
api_router.include_router(analysis_router, prefix="/analysis", tags=["analysis"])