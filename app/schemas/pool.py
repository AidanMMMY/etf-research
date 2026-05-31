from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class PoolMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    etf_code: str
    etf_name: Optional[str] = None
    added_at: Optional[datetime] = None
    notes: Optional[str] = None


class PoolBase(BaseModel):
    name: str
    description: Optional[str] = None


class PoolCreate(PoolBase):
    pass


class PoolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class PoolResponse(PoolBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    members: List[PoolMemberResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PoolMemberCreate(BaseModel):
    etf_code: str
    notes: Optional[str] = None
