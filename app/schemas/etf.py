from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ETFInfoBase(BaseModel):
    code: str
    name: str
    exchange: Optional[str] = None
    market: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    manager: Optional[str] = None
    currency: str = "CNY"
    is_qdii: bool = False
    underlying_index: Optional[str] = None
    inception_date: Optional[date] = None
    status: str = "active"


class ETFInfoResponse(ETFInfoBase):
    model_config = ConfigDict(from_attributes=True)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ETFListResponse(BaseModel):
    items: List[ETFInfoResponse]
    total: int
    page: int
    page_size: int


class ETFFilterParams(BaseModel):
    market: Optional[str] = None
    category: Optional[str] = None
    search: Optional[str] = None
    page: int = 1
    page_size: int = 50
