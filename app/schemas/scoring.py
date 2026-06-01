"""Scoring system Pydantic schemas.

Provides request/response models for score templates and ETF composite scores.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


# ------------------------------------------------------------------
# ScoreTemplate schemas
# ------------------------------------------------------------------

class ScoreTemplateBase(BaseModel):
    """Base schema for score template fields."""

    name: str
    description: Optional[str] = None
    weights: Dict[str, Any]
    is_default: bool = False


class ScoreTemplateCreate(ScoreTemplateBase):
    """Schema for creating a new score template."""

    pass


class ScoreTemplateUpdate(BaseModel):
    """Schema for updating an existing score template."""

    name: Optional[str] = None
    description: Optional[str] = None
    weights: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None


class ScoreTemplateResponse(ScoreTemplateBase):
    """Schema for score template responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ------------------------------------------------------------------
# ETFScore schemas
# ------------------------------------------------------------------

class ETFScoreResponse(BaseModel):
    """Schema for ETF composite score responses.

    Includes all score fields along with ETF metadata (name, market, category)
    and the trade date for the score snapshot.
    """

    etf_code: str
    etf_name: Optional[str] = None
    market: Optional[str] = None
    category: Optional[str] = None
    trade_date: Optional[date] = None
    composite_score: Optional[float] = None
    score_return: Optional[float] = None
    score_risk: Optional[float] = None
    score_sharpe: Optional[float] = None
    score_liquidity: Optional[float] = None
    score_trend: Optional[float] = None
    rank_overall: Optional[int] = None
    rank_category: Optional[int] = None


class ETFScoreListResponse(BaseModel):
    """Schema for a paginated list of ETF scores."""

    items: List[ETFScoreResponse]
    total: int
    template_id: int
    trade_date: Optional[date] = None
