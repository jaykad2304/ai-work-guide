from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from backend.database import get_db
from backend.models import Event, DailyMetadata

router = APIRouter(prefix="/timeline", tags=["timeline"])

@router.get("")
async def get_timeline(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get timeline for last N days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    events = db.query(Event)\
        .filter(Event.timestamp >= cutoff_date)\
        .order_by(desc(Event.timestamp))\
        .all()

    metadata_list = db.query(DailyMetadata)\
        .filter(DailyMetadata.date >= cutoff_date.strftime('%Y-%m-%d'))\
        .order_by(desc(DailyMetadata.date))\
        .all()

    return {
        "days_shown": days,
        "total_events": len(events),
        "events": [e.to_dict() for e in events],
        "daily_summaries": [m.to_dict() for m in metadata_list]
    }

@router.get("/by-project")
async def get_by_project(days: int = 30, db: Session = Depends(get_db)):
    """Get sessions grouped by project"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    events = db.query(Event)\
        .filter(Event.timestamp >= cutoff)\
        .order_by(desc(Event.timestamp))\
        .all()

    projects = {}
    for event in events:
        key = event.project or 'unknown'
        if key not in projects:
            projects[key] = {'name': key, 'sessions': [], 'total_tokens': 0, 'total_sessions': 0}
        projects[key]['sessions'].append(event.to_dict())
        projects[key]['total_tokens'] += event.tokens_used or 0
        projects[key]['total_sessions'] += 1

    return {'projects': sorted(projects.values(), key=lambda x: x['total_sessions'], reverse=True)}

@router.get("/{date}")
async def get_day_details(date: str, db: Session = Depends(get_db)):
    """Get all sessions for a specific date (YYYY-MM-DD)"""
    try:
        datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    events = db.query(Event)\
        .filter(Event.timestamp.cast('date') == date)\
        .order_by(desc(Event.timestamp))\
        .all()

    metadata = db.query(DailyMetadata)\
        .filter(DailyMetadata.date == date)\
        .first()

    return {
        "date": date,
        "total_sessions": len(events),
        "sessions": [e.to_dict() for e in events],
        "daily_metadata": metadata.to_dict() if metadata else None
    }

@router.get("/{session_id}/detail")
async def get_session_detail(session_id: str, db: Session = Depends(get_db)):
    """Get full details of a session including raw content"""
    event = db.query(Event)\
        .filter(Event.session_id == session_id)\
        .first()

    if not event:
        raise HTTPException(status_code=404, detail="Session not found")

    import json
    raw_content = json.loads(event.raw_content) if event.raw_content else {}

    return {
        "event": event.to_dict(),
        "full_conversation": raw_content.get('messages', [])
    }
