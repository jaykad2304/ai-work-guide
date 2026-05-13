from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from backend.database import get_db
from backend.models import Event

router = APIRouter(prefix="/search", tags=["search"])

@router.get("")
async def search(
    q: str = Query(..., min_length=1),
    tool: str = Query(None),
    db: Session = Depends(get_db)
):
    """Search events by query string and optional tool filter"""
    query = db.query(Event)

    search_term = f"%{q}%"
    query = query.filter(
        or_(
            Event.title.ilike(search_term),
            Event.summary.ilike(search_term),
            Event.topics.ilike(search_term)
        )
    )

    if tool:
        query = query.filter(Event.tool == tool)

    results = query.order_by(desc(Event.timestamp)).all()

    return {
        "query": q,
        "tool_filter": tool,
        "results_count": len(results),
        "results": [e.to_dict() for e in results]
    }

@router.get("/topic/{topic}")
async def search_by_topic(topic: str, db: Session = Depends(get_db)):
    """Get all events for a specific topic"""
    search_term = f"%{topic}%"
    events = db.query(Event)\
        .filter(Event.topics.ilike(search_term))\
        .order_by(desc(Event.timestamp))\
        .all()

    return {
        "topic": topic,
        "results_count": len(events),
        "results": [e.to_dict() for e in events]
    }
