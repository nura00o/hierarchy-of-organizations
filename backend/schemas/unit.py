from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class UnitBase(BaseModel):
    id: int
    name: str
    bin: Optional[str] = None
    code: Optional[str] = None
    code_abp: Optional[str] = None
    parent_id: Optional[int] = None
    level: int
    direct_children_count: int
    total_descendants_count: int

    model_config = ConfigDict(from_attributes=True)


class UnitWithChildren(UnitBase):
    children: List["UnitWithChildren"] = []


class UnitNode(UnitBase):
    """A lightweight node for tree loading (no nested children)."""


class SearchResult(UnitBase):
    highlight: Optional[str] = None


UnitWithChildren.model_rebuild()
