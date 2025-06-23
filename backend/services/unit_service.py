"""Service layer encapsulating DB queries for the Unit model."""

from typing import List, Optional

from sqlalchemy import Select, select, text, or_, cast, String
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
    """Advanced search that prioritises exact matches on `bin`, `code`, `code_abp`.

    1. Exact equality on bin/code/code_abp (in that order).
    2. Fuzzy matching on `name` using existing ranking logic.
    This guarantees that e.g. `code_abp = 201` appears before "Школа №201"."""

    # Ranking factors (higher is better):
    # 1. Exact equality handled separately above.
    # 2. Name prefix match.
    # 3. Trigram similarity metrics (word_similarity / similarity).
    # 4. Position of match – earlier is better.
    # 5. Shorter names first.

    # Note: Requires PostgreSQL extensions:
    #   CREATE EXTENSION IF NOT EXISTS pg_trgm;
    #   CREATE INDEX IF NOT EXISTS idx_units_name_trgm ON units USING gin (name gin_trgm_ops);

    # -------------------------
    # 1. Exact matches on codes
    # -------------------------
    filters = [Unit.bin == query, Unit.code == query]

    # Attempt to interpret query as 32-bit integer for code_abp when reasonable.
    if query.isdigit():
        int_val = int(query)
        # PostgreSQL `integer` is 32-bit; avoid overflow errors
        if -2147483648 <= int_val <= 2147483647:
            filters.append(Unit.code_abp == int_val)
    # Always include string equality (legacy/edge cases)
    filters.append(cast(Unit.code_abp, String) == query)  # type: ignore

    exact_stmt = (
        select(Unit)
        .where(or_(*filters))
        .order_by(Unit.name)
    )
    exact_res = await session.execute(exact_stmt)
    exact_units = exact_res.scalars().unique().all()

    # If we've satisfied the requested window – slice and return
    combined: List[Unit] = exact_units
    if len(combined) >= offset + limit:
        return combined[offset : offset + limit]

    # Calculate remaining rows to fetch from fuzzy search.
    remaining = (offset + limit) - len(combined)

    # ---------------------------------
    # 2. Fuzzy search on the `name` field
    # ---------------------------------

    # Build a SELECT * FROM (...) fuzzy statement identical to previous but excluding already seen ids.
    fuzzy_sql = text(
        """
        WITH q AS (
            SELECT lower(:q) AS qtxt,
                   lower(:like_q) AS like_q,
                   lower(:like_prefix) AS like_prefix
        )
        SELECT u.*
        FROM units u, q
        WHERE
            lower(u.name) LIKE q.like_q OR
            similarity(u.name, q.qtxt) > 0.2 OR
            word_similarity(u.name, q.qtxt) > 0.2
        ORDER BY
            (lower(u.name) = q.qtxt) DESC,
            (lower(u.name) LIKE q.like_prefix) DESC,
            GREATEST(word_similarity(u.name, q.qtxt), similarity(u.name, q.qtxt)) DESC,
            POSITION(q.qtxt IN lower(u.name)),
            length(u.name)
        LIMIT :limit
        OFFSET 0; -- offset already accounted for in combined list
        """
    )

    seen_ids = {u.id for u in exact_units}

    params = {
        "q": query,
        "like_q": f"%{query.lower()}%",
        "like_prefix": f"{query.lower()}%",
        "limit": remaining,
    }

    fuzzy_res = await session.execute(fuzzy_sql, params)
    fuzzy_rows = fuzzy_res.mappings().all()
    fuzzy_units = [Unit(**{k: v for k, v in r.items() if k in Unit.__table__.columns}) for r in fuzzy_rows]

    combined.extend([u for u in fuzzy_units if u.id not in seen_ids])
    return combined[offset : offset + limit]



