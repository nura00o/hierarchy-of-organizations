from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_session
from ..schemas.unit import SearchResult, UnitWithChildren, UnitNode
from ..services.unit_service import get_tree, get_unit, search_units, get_path

router = APIRouter(prefix="/units", tags=["Units"])


@router.get("/unit/{unit_id}", response_model=UnitWithChildren)
async def read_unit(
    unit_id: int, session: AsyncSession = Depends(get_session)
):
    unit = await get_unit(session, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.get("/tree", response_model=List[UnitNode])
async def read_tree(
    parent_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await get_tree(session, parent_id)


@router.get("/path/{unit_id}", response_model=List[UnitNode])
async def read_path(unit_id: int, session: AsyncSession = Depends(get_session)):
    return await get_path(session, unit_id)


@router.get("/search", response_model=List[SearchResult])
async def search_units_endpoint(
    q: str = Query(..., alias="query"),
    exact: bool = False,
    limit: int = Query(20, ge=1, le=100),
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    return await search_units(session, q, exact, limit, offset)
