from datetime import date
from typing import List, Optional
from pydantic import BaseModel


class DailyBarResponse(BaseModel):
    trade_date: date
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None
    amount: Optional[float] = None
    change_pct: Optional[float] = None
    turnover_rate: Optional[float] = None


class MarketDataHistoryResponse(BaseModel):
    etf_code: str
    etf_name: Optional[str] = None
    items: List[DailyBarResponse]


class SnapshotItem(BaseModel):
    etf_code: str
    etf_name: Optional[str] = None
    close: Optional[float] = None
    change_pct: Optional[float] = None
    volume: Optional[int] = None
    amount: Optional[float] = None


class MarketSnapshotResponse(BaseModel):
    items: List[SnapshotItem]
    count: int
