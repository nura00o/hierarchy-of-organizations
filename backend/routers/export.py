from __future__ import annotations

"""Endpoints to export the whole organisation hierarchy in various formats."""

from io import BytesIO
from typing import Dict, List

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_session
from ..models.unit import Unit

router = APIRouter(prefix="/export", tags=["Export"])


async def _get_all_units(session: AsyncSession) -> List[Unit]:
    res = await session.execute(select(Unit))
    return res.scalars().all()


_FIELDS = [
    "id",
    "name",
    "bin",
    "code",
    "code_abp",
    "parent_id",
    "level",
]


def _unit_to_dict(u: Unit) -> Dict:
    return {k: getattr(u, k) for k in _FIELDS}


def _build_nested(units: List[Unit]) -> List[Dict]:
    """Build nested children list using parent_id."""

    node_map: Dict[int, Dict] = {}
    roots: List[Dict] = []

    # create bare nodes
    for u in units:
        node_map[u.id] = {**_unit_to_dict(u), "children": []}

    # attach children
    for u in units:
        rec = node_map[u.id]
        if u.parent_id and u.parent_id in node_map:
            node_map[u.parent_id]["children"].append(rec)
        else:
            roots.append(rec)
    return roots


@router.get("/json")
async def export_json(session: AsyncSession = Depends(get_session)):
    """Return full hierarchy as nested JSON."""
    units = await _get_all_units(session)
    nested = _build_nested(units)
    return JSONResponse(content=nested)


@router.get("/excel")
async def export_excel(session: AsyncSession = Depends(get_session)):
    """Return the hierarchy as an Excel XLSX file."""
    units = await _get_all_units(session)
    id_map = {u.id: u for u in units}

    rows: List[Dict] = []
    for u in units:
        path_parts = []
        curr = u
        while curr is not None:
            path_parts.append(curr.name)
            curr = id_map.get(curr.parent_id)
        path = " / ".join(reversed(path_parts))

        rec = _unit_to_dict(u)
        rec["path"] = path
        rows.append(rec)

    df = pd.DataFrame(rows)

    buf = BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Units")
    buf.seek(0)

    headers = {
        "Content-Disposition": "attachment; filename=units.xlsx"
    }
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )
