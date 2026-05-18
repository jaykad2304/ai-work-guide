from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from backend.database import get_db
from backend.models import Event

router = APIRouter(prefix="/api", tags=["events"])


class EventPayload(BaseModel):
    tool: str
    title: str
    summary: Optional[str] = None
    topics: Optional[str] = None
    project: Optional[str] = None
    session_id: Optional[str] = None
    tokens_used: Optional[int] = 0
    duration_minutes: Optional[int] = 1
    timestamp: Optional[datetime] = None
    metadata: Optional[dict] = None


@router.post("/events")
def push_event(payload: EventPayload, db=Depends(get_db)):
    """Accept event from external sources (VS Code extension, browser extension, etc.)"""
    ts = payload.timestamp or datetime.utcnow()
    session_id = payload.session_id or f"{payload.tool}-ext-{uuid.uuid4().hex[:12]}"

    existing = db.query(Event).filter(Event.session_id == session_id).first()
    if existing:
        return {"status": "duplicate", "session_id": session_id}

    event = Event(
        timestamp=ts,
        tool=payload.tool,
        session_id=session_id,
        project=payload.project,
        title=payload.title,
        summary=payload.summary,
        topics=payload.topics or '',
        tokens_used=payload.tokens_used or 0,
        duration_minutes=payload.duration_minutes or 1,
        raw_content=str(payload.metadata or {}),
        indexed=True
    )
    db.add(event)
    db.commit()

    return {"status": "ok", "session_id": session_id}
