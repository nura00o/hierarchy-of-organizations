"""Utility helpers for building search statements with PostgreSQL pg_trgm support."""

from typing import Tuple, Dict


def build_search_filter(query: str, exact: bool) -> Tuple[str, Dict[str, str]]:
    """Return a (SQL clause, params) tuple suitable for text() binding.

    We build a dynamic WHERE clause that is safe to include inside SQLAlchemy's
    text() while still benefitting from indices (B-Tree for exact fields and
    GIN pg_trgm for fuzzy `name`).
    """

    if exact:
        clause = """
        bin = :q OR code = :q OR code_abp = :q OR name = :q
        """
        params = {"q": query}
    else:
        # Using ILIKE allows index usage with text_pattern_ops. Additionally,
        # similarity(name, :q) leverages pg_trgm index for fuzzy search.
        # The > 0.3 threshold can be tuned.
        clause = """
            bin ILIKE :like_q OR
            code ILIKE :like_q OR
            code_abp ILIKE :like_q OR
            name ILIKE :like_q OR
            similarity(name, :q) > 0.3
        """
        params = {"like_q": f"%{query}%", "q": query}

    return clause, params
