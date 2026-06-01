"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.scheduler import init_scheduler, shutdown_scheduler
from app.api.v1 import etfs, pools, market_data, indicators, analysis, etl, scoring, screening

settings = get_settings()

app = FastAPI(
    title=settings.project_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}

# Include v1 routers
app.include_router(etfs.router, prefix=f"{settings.api_v1_prefix}/etfs", tags=["ETFs"])
app.include_router(pools.router, prefix=f"{settings.api_v1_prefix}/pools", tags=["Pools"])
app.include_router(
    market_data.router, prefix=f"{settings.api_v1_prefix}/market-data", tags=["Market Data"]
)
app.include_router(
    indicators.router, prefix=f"{settings.api_v1_prefix}/indicators", tags=["Indicators"]
)
app.include_router(
    analysis.router, prefix=f"{settings.api_v1_prefix}/analysis", tags=["Analysis"]
)
app.include_router(etl.router, prefix=f"{settings.api_v1_prefix}/etl", tags=["ETL"])
app.include_router(
    scoring.router, prefix=f"{settings.api_v1_prefix}/scores", tags=["Scoring"]
)
app.include_router(
    screening.router, prefix=f"{settings.api_v1_prefix}/screen", tags=["Screening"]
)


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    init_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    shutdown_scheduler()
