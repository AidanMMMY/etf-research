"""Market data business logic service.

Provides queries for historical OHLCV bars and market snapshots.
"""

from datetime import date
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.etf import ETFDailyBar, ETFInfo
from app.schemas.market_data import (
    DailyBarResponse,
    MarketDataHistoryResponse,
    MarketSnapshotResponse,
    SnapshotItem,
)


class MarketDataService:
    """Service for market data queries."""

    def __init__(self, db: Session):
        self.db = db

    def get_history(
        self,
        code: str,
        start: Optional[date] = None,
        end: Optional[date] = None,
    ) -> MarketDataHistoryResponse:
        """Get historical OHLCV bars for an ETF.

        Args:
            code: ETF code.
            start: Start date (inclusive).
            end: End date (inclusive).

        Returns:
            MarketDataHistoryResponse with bars and ETF info.
        """
        query = self.db.query(ETFDailyBar).filter(
            ETFDailyBar.etf_code == code
        )

        if start:
            query = query.filter(ETFDailyBar.trade_date >= start)
        if end:
            query = query.filter(ETFDailyBar.trade_date <= end)

        bars = query.order_by(ETFDailyBar.trade_date.asc()).all()

        etf = (
            self.db.query(ETFInfo.name)
            .filter(ETFInfo.code == code)
            .scalar()
        )

        items = [
            DailyBarResponse(
                trade_date=bar.trade_date,
                open=float(bar.open) if bar.open is not None else None,
                high=float(bar.high) if bar.high is not None else None,
                low=float(bar.low) if bar.low is not None else None,
                close=float(bar.close) if bar.close is not None else None,
                volume=int(bar.volume) if bar.volume is not None else None,
                amount=float(bar.amount) if bar.amount is not None else None,
                change_pct=float(bar.change_pct)
                if bar.change_pct is not None
                else None,
                turnover_rate=float(bar.turnover_rate)
                if bar.turnover_rate is not None
                else None,
            )
            for bar in bars
        ]

        return MarketDataHistoryResponse(
            etf_code=code,
            etf_name=etf,
            items=items,
        )

    def get_snapshot(self, codes: List[str]) -> MarketSnapshotResponse:
        """Get the latest market snapshot for a list of ETF codes.

        For each code, returns the most recent daily bar.

        Args:
            codes: List of ETF codes.

        Returns:
            MarketSnapshotResponse with snapshot items.
        """
        if not codes:
            return MarketSnapshotResponse(items=[], count=0)

        # Subquery: latest trade_date per ETF
        latest_dates = (
            self.db.query(
                ETFDailyBar.etf_code,
                func.max(ETFDailyBar.trade_date).label("latest_date"),
            )
            .filter(ETFDailyBar.etf_code.in_(codes))
            .group_by(ETFDailyBar.etf_code)
            .subquery()
        )

        results = (
            self.db.query(
                ETFDailyBar.etf_code,
                ETFInfo.name,
                ETFDailyBar.close,
                ETFDailyBar.change_pct,
                ETFDailyBar.volume,
                ETFDailyBar.amount,
            )
            .join(
                latest_dates,
                (ETFDailyBar.etf_code == latest_dates.c.etf_code)
                & (ETFDailyBar.trade_date == latest_dates.c.latest_date),
            )
            .outerjoin(ETFInfo, ETFDailyBar.etf_code == ETFInfo.code)
            .all()
        )

        items = [
            SnapshotItem(
                etf_code=r.etf_code,
                etf_name=r.name,
                close=float(r.close) if r.close is not None else None,
                change_pct=float(r.change_pct)
                if r.change_pct is not None
                else None,
                volume=int(r.volume) if r.volume is not None else None,
                amount=float(r.amount) if r.amount is not None else None,
            )
            for r in results
        ]

        return MarketSnapshotResponse(items=items, count=len(items))
