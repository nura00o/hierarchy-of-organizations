"""Feedback endpoints: receive feedback from frontend and relay it to Telegram."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional
from enum import Enum

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_session
from ..services.unit_service import get_unit, get_path

CHAT_ID = os.getenv("FEEDBACK_CHAT_ID", "-1002659337647")
BOT_TOKEN = os.getenv("FEEDBACK_BOT_TOKEN", "")

if not BOT_TOKEN:
    raise RuntimeError("Telegram bot token not configured. Set FEEDBACK_BOT_TOKEN env var.")

router = APIRouter(prefix="/feedback", tags=["Feedback"])


class FeedbackType(str, Enum):
    bug = "Сообщить об ошибке"
    suggestion = "Предложить правку"
    comment = "Оставить комментарий"


class FeedbackIn(BaseModel):
    type: FeedbackType = Field(..., description="Тип обращения")
    message: str = Field(..., min_length=3, description="Текст сообщения")
    contact: Optional[str] = Field(None, description="Email или телефон")
    unit_id: Optional[int] = Field(None, description="ID выбранной организации")


@router.post("/")
async def submit_feedback(payload: FeedbackIn, session: AsyncSession = Depends(get_session)):
    """Receive feedback and forward to Telegram."""
    unit_part = ""
    if payload.unit_id is not None:
        unit = await get_unit(session, payload.unit_id)
        if unit:
            # Build path text
            path_nodes = await get_path(session, payload.unit_id)
            path_text = " → ".join([n["name"] if isinstance(n, dict) else n.name for n in path_nodes])
            unit_part = (
                f"\n🏢 Организация: {unit.name}\n"
                f"🔍 BIN: {unit.bin or '-'}\n"
                f"🧭 Путь: {path_text}"
            )
    # Compose message
    ts = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M")
    text = (
        f"🛠 Обратная связь: {payload.type}{unit_part}\n\n"
        f"💬 Сообщение:\n{payload.message}\n\n"
        f"📞 Контакт: {payload.contact or '-'}\n"
        f"🕒 Время: {ts}"
    )

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(url, data={"chat_id": CHAT_ID, "text": text})
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to deliver to Telegram: {exc}") from exc

    return {"status": "ok"}
