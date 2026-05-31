"""Pool API routes.

Provides CRUD endpoints for ETF pools and member management.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_pool_service
from app.schemas.pool import PoolCreate, PoolMemberCreate, PoolResponse, PoolUpdate
from app.services.pool_service import PoolService

router = APIRouter()


@router.get("", response_model=list[PoolResponse])
def list_pools(service: PoolService = Depends(get_pool_service)):
    """List all ETF pools with their active members."""
    return service.list_pools()


@router.post("", response_model=PoolResponse, status_code=201)
def create_pool(data: PoolCreate, service: PoolService = Depends(get_pool_service)):
    """Create a new ETF pool."""
    return service.create_pool(data)


@router.get("/{pool_id}", response_model=PoolResponse)
def get_pool(pool_id: int, service: PoolService = Depends(get_pool_service)):
    """Get a single pool by ID."""
    pool = service.get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail=f"Pool {pool_id} not found")
    return pool


@router.put("/{pool_id}", response_model=PoolResponse)
def update_pool(
    pool_id: int,
    data: PoolUpdate,
    service: PoolService = Depends(get_pool_service),
):
    """Update an existing pool."""
    pool = service.update_pool(pool_id, data)
    if not pool:
        raise HTTPException(status_code=404, detail=f"Pool {pool_id} not found")
    return pool


@router.delete("/{pool_id}", status_code=204)
def delete_pool(pool_id: int, service: PoolService = Depends(get_pool_service)):
    """Delete a pool by ID."""
    deleted = service.delete_pool(pool_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Pool {pool_id} not found")
    return None


@router.post("/{pool_id}/members", response_model=PoolResponse)
def add_member(
    pool_id: int,
    data: PoolMemberCreate,
    service: PoolService = Depends(get_pool_service),
):
    """Add an ETF to a pool."""
    pool = service.add_member(pool_id, data)
    if not pool:
        raise HTTPException(status_code=404, detail=f"Pool {pool_id} not found")
    return pool


@router.delete("/{pool_id}/members/{etf_code}", response_model=PoolResponse)
def remove_member(
    pool_id: int,
    etf_code: str,
    service: PoolService = Depends(get_pool_service),
):
    """Remove an ETF from a pool (soft delete)."""
    pool = service.remove_member(pool_id, etf_code)
    if not pool:
        raise HTTPException(status_code=404, detail=f"Pool {pool_id} not found")
    return pool
