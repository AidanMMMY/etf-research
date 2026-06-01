"""Report generation Pydantic schemas.

Provides request/response models for report generation, status tracking,
and report listing operations.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ------------------------------------------------------------------
# Report generation request
# ------------------------------------------------------------------

class ReportGenerateRequest(BaseModel):
    """Request model for triggering report generation."""

    report_type: str = "pool_weekly"
    pool_id: Optional[int] = None
    format: str = "html"
    template_id: Optional[int] = None


# ------------------------------------------------------------------
# Report response models
# ------------------------------------------------------------------

class ReportResponse(BaseModel):
    """Response model for a generated report."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    report_type: str
    report_date: date
    pool_id: Optional[int] = None
    status: str
    format: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    created_at: Optional[datetime] = None


class ReportStatusResponse(BaseModel):
    """Response model for report generation status."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error_msg: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
