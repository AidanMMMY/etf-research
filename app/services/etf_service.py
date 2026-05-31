"""ETF business logic service.

Provides CRUD operations and filtering for ETF basic information.
"""

from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.etf import ETFInfo
from app.schemas.etf import ETFFilterParams, ETFInfoResponse, ETFListResponse


class ETFService:
    """Service for ETF basic information operations."""

    def __init__(self, db: Session):
        self.db = db

    def list_etfs(self, params: ETFFilterParams) -> ETFListResponse:
        """List ETFs with filtering and pagination."""
        query = self.db.query(ETFInfo)

        if params.market:
            query = query.filter(ETFInfo.market == params.market)
        if params.category:
            query = query.filter(ETFInfo.category == params.category)
        if params.search:
            search = f"%{params.search}%"
            query = query.filter(
                (ETFInfo.code.ilike(search)) | (ETFInfo.name.ilike(search))
            )

        total = query.count()
        offset = (params.page - 1) * params.page_size
        items = query.offset(offset).limit(params.page_size).all()

        return ETFListResponse(
            items=[ETFInfoResponse.model_validate(item) for item in items],
            total=total,
            page=params.page,
            page_size=params.page_size,
        )

    def get_etf(self, code: str) -> Optional[ETFInfoResponse]:
        """Get a single ETF by code."""
        etf = self.db.query(ETFInfo).filter(ETFInfo.code == code).first()
        return ETFInfoResponse.model_validate(etf) if etf else None

    def get_categories(self) -> List[str]:
        """Get all distinct ETF categories."""
        results = self.db.query(ETFInfo.category).distinct().all()
        return [r[0] for r in results if r[0]]

    def get_markets(self) -> List[str]:
        """Get all distinct ETF markets."""
        results = self.db.query(ETFInfo.market).distinct().all()
        return [r[0] for r in results if r[0]]
