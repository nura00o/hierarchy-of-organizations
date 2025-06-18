"""Service layer encapsulating DB queries for the Unit model."""

from typing import List, Optional

from sqlalchemy import Select, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.unit import Unit



async def get_unit(session: AsyncSession, unit_id: int) -> Optional[Unit]:
    stmt: Select = (
        select(Unit)
        .options(selectinload(Unit.children))
        .where(Unit.id == unit_id)
    )
    res = await session.execute(stmt)
    return res.scalar_one_or_none()


async def get_tree(session: AsyncSession, parent_id: Optional[int] = None) -> List[Unit]:
    if parent_id is None:
        stmt = select(Unit).where(Unit.parent_id.is_(None)).order_by(Unit.name)
    else:
        stmt = select(Unit).where(Unit.parent_id == parent_id).order_by(Unit.name)

    res = await session.execute(stmt)
    return res.scalars().unique().all()


async def get_path(session: AsyncSession, unit_id: int) -> List[Unit]:
    """Return list of units from root to the given unit (inclusive)."""

    sql = text(
        """
        WITH RECURSIVE path AS (
            SELECT * FROM units WHERE id = :unit_id
            UNION ALL
            SELECT u.* FROM units u
            JOIN path p ON u.id = p.parent_id
        )
        SELECT * FROM path ORDER BY level;
        """
    )
    res = await session.execute(sql, {"unit_id": unit_id})
    rows = res.mappings().all()
    # return list[dict]; FastAPI + Pydantic will coerce to UnitNode
    return [dict(r) for r in rows]


async def search_units(
    session: AsyncSession,
    query: str,
    exact: bool,
    limit: int,
    offset: int,
):
    """Advanced fuzzy search with ranking.

    Ranking factors (higher is better):
    1. **Exact equality**: the name matches the query exactly.
    2. **Prefix match**: name starts with the query.
    3. **`word_similarity` / `similarity`**: pg_trgm metrics.
    4. **Position of match**: earlier appearances win.
    5. **Shorter name**: slight boost to more concise matches.

    Requires PostgreSQL extensions:
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE INDEX IF NOT EXISTS idx_units_name_trgm ON units USING gin (name gin_trgm_ops);
    """

    if exact:
        # Fast path for exact match – leverage B-Tree indices.
        stmt = (
            select(Unit)
            .where(
                (Unit.name == query)
                | (Unit.bin == query)
                | (Unit.code == query)
                | (Unit.code_abp == query)
            )
            .limit(limit)
            .offset(offset)
        )
        res = await session.execute(stmt)
        return res.scalars().all()

    # Flexible fuzzy search ranking using raw SQL for full control.
    sql = text(
        """
        WITH q AS (
            SELECT
                lower(:q)                         AS qtxt,
                lower(:like_q)                    AS like_q,
                lower(:like_prefix)               AS like_prefix
        )
        SELECT u.*
        FROM units u, q
        WHERE
            -- Cheap prefix / substring checks (use text_pattern_ops index)
            lower(u.name) LIKE q.like_q
            OR similarity(u.name, q.qtxt) > 0.2
            OR word_similarity(u.name, q.qtxt) > 0.2
        ORDER BY
            -- 1. exact equality highest priority
            (lower(u.name) = q.qtxt) DESC,
            -- 2. name starts with query
            (lower(u.name) LIKE q.like_prefix) DESC,
            -- 3. combined trigram similarity metrics
            GREATEST(word_similarity(u.name, q.qtxt), similarity(u.name, q.qtxt)) DESC,
            -- 4. earlier position of the query substring
            POSITION(q.qtxt IN lower(u.name)),
            -- 5. shorter names first (more specific)
            length(u.name)
        LIMIT :limit OFFSET :offset;
        """
    )

    params = {
        "q": query,
        "like_q": f"%{query.lower()}%",
        "like_prefix": f"{query.lower()}%",
        "limit": limit,
        "offset": offset,
    }

    res = await session.execute(sql, params)
    rows = res.mappings().all()
    # rows contain dicts with all Unit columns; convert to Unit model instances
    return [Unit(**{k: v for k, v in r.items() if k in Unit.__table__.columns}) for r in rows]
