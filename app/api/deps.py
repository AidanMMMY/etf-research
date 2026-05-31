"""FastAPI dependency injection utilities.

Provides database session and service instance dependencies for all API routes.
"""

from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.etf_service import ETFService
from app.services.pool_service import PoolService
from app.services.market_data_service import MarketDataService
from app.services.indicator_service import IndicatorService
from app.services.analysis_service import AnalysisService


def get_db() -> Generator[Session, None, None]:
    """Yield a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_etf_service(db: Session = Depends(get_db)) -> ETFService:
    """Provide an ETFService instance with a DB session."""
    return ETFService(db)


def get_pool_service(db: Session = Depends(get_db)) -> PoolService:
    """Provide a PoolService instance with a DB session."""
    return PoolService(db)


def get_market_data_service(db: Session = Depends(get_db)) -> MarketDataService:
    """Provide a MarketDataService instance with a DB session."""
    return MarketDataService(db)


def get_indicator_service(db: Session = Depends(get_db)) -> IndicatorService:
    """Provide an IndicatorService instance with a DB session."""
    return IndicatorService(db)


def get_analysis_service(db: Session = Depends(get_db)) -> AnalysisService:
    """Provide an AnalysisService instance with a DB session."""
    return AnalysisService(db)
