from datetime import date
from typing import List, Optional
from pydantic import BaseModel


class IndicatorResponse(BaseModel):
    etf_code: str
    trade_date: date
    # 移动平均
    ma5: Optional[float] = None
    ma10: Optional[float] = None
    ma20: Optional[float] = None
    ma60: Optional[float] = None
    # 动量
    rsi14: Optional[float] = None
    macd_dif: Optional[float] = None
    macd_dea: Optional[float] = None
    macd_hist: Optional[float] = None
    # 风险
    volatility_20d: Optional[float] = None
    volatility_60d: Optional[float] = None
    max_drawdown_1y: Optional[float] = None
    sharpe_1y: Optional[float] = None
    # 收益
    return_1w: Optional[float] = None
    return_1m: Optional[float] = None
    return_3m: Optional[float] = None
    return_6m: Optional[float] = None
    return_1y: Optional[float] = None
    # 其他
    atr14: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_lower: Optional[float] = None


class IndicatorBatchResponse(BaseModel):
    items: List[IndicatorResponse]
    count: int
