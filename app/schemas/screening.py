"""ETF screening Pydantic schemas.

Provides request/response models for ETF screening, ranking, and preset queries.
"""

from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ------------------------------------------------------------------
# Screening filter / result schemas
# ------------------------------------------------------------------

class ScreenFilter(BaseModel):
    """Schema for ETF screening filter parameters.

    All fields are optional. When provided, they define the filtering
    criteria applied to the latest indicator data per ETF.
    """

    market: Optional[str] = Field(None, description="Filter by market (e.g. SH, SZ)")
    category: Optional[str] = Field(None, description="Filter by ETF category")
    rsi_min: Optional[float] = Field(None, ge=0, le=100, description="Minimum RSI14")
    rsi_max: Optional[float] = Field(None, ge=0, le=100, description="Maximum RSI14")
    sharpe_min: Optional[float] = Field(None, description="Minimum Sharpe ratio (1y)")
    sharpe_max: Optional[float] = Field(None, description="Maximum Sharpe ratio (1y)")
    volatility_min: Optional[float] = Field(None, ge=0, description="Minimum 20d volatility")
    volatility_max: Optional[float] = Field(None, ge=0, description="Maximum 20d volatility")
    return_1m_min: Optional[float] = Field(None, description="Minimum 1-month return")
    return_1m_max: Optional[float] = Field(None, description="Maximum 1-month return")
    return_3m_min: Optional[float] = Field(None, description="Minimum 3-month return")
    return_3m_max: Optional[float] = Field(None, description="Maximum 3-month return")
    return_1y_min: Optional[float] = Field(None, description="Minimum 1-year return")
    return_1y_max: Optional[float] = Field(None, description="Maximum 1-year return")
    score_min: Optional[float] = Field(None, ge=0, le=100, description="Minimum composite score")
    score_max: Optional[float] = Field(None, ge=0, le=100, description="Maximum composite score")
    template_id: Optional[int] = Field(None, description="Score template ID for score filtering")
    sort_by: str = Field("composite_score", description="Field to sort by")
    sort_order: str = Field("desc", description="Sort order: asc or desc")
    offset: int = Field(0, ge=0, description="Pagination offset")
    limit: int = Field(50, ge=1, le=500, description="Pagination limit")


class ScreenResultItem(BaseModel):
    """Schema for a single ETF screening result."""

    etf_code: str
    etf_name: Optional[str] = None
    market: Optional[str] = None
    category: Optional[str] = None
    trade_date: Optional[str] = None
    sharpe_1y: Optional[float] = None
    volatility_20d: Optional[float] = None
    rsi14: Optional[float] = None
    return_1m: Optional[float] = None
    return_3m: Optional[float] = None
    return_1y: Optional[float] = None
    max_drawdown_1y: Optional[float] = None
    composite_score: Optional[float] = None
    score_return: Optional[float] = None
    score_risk: Optional[float] = None
    score_sharpe: Optional[float] = None
    score_liquidity: Optional[float] = None
    score_trend: Optional[float] = None
    rank_overall: Optional[int] = None
    rank_category: Optional[int] = None


class ScreenResult(BaseModel):
    """Schema for ETF screening response."""

    items: List[ScreenResultItem]
    count: int
    offset: int
    limit: int
    preset: Optional[Dict[str, Any]] = None


# ------------------------------------------------------------------
# Preset schemas
# ------------------------------------------------------------------

class PresetItem(BaseModel):
    """Schema for a screening preset."""

    key: str
    name: str
    description: str
    filters: Dict[str, Any]
    sort_by: str
    sort_order: str


class PresetListResponse(BaseModel):
    """Schema for preset list response."""

    presets: List[PresetItem]


# ------------------------------------------------------------------
# Category schemas
# ------------------------------------------------------------------

class CategoryItem(BaseModel):
    """Schema for a category with ETF count."""

    category: str
    count: int


class CategoryListResponse(BaseModel):
    """Schema for category list response."""

    categories: List[CategoryItem]
