from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Event
import json
from datetime import datetime

router = APIRouter(prefix="/export", tags=["export"])

@router.post("/json")
async def export_json(db: Session = Depends(get_db)):
    """Export all events as JSON"""
    events = db.query(Event).all()

    data = {
        "exported_at": datetime.utcnow().isoformat(),
        "total_events": len(events),
        "events": [e.to_dict() for e in events]
    }

    json_str = json.dumps(data, indent=2)

    return StreamingResponse(
        iter([json_str]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=timeline-export.json"}
    )

@router.post("/markdown")
async def export_markdown(db: Session = Depends(get_db)):
    """Export timeline as markdown (for Claude context)"""
    events = db.query(Event).order_by(Event.timestamp.desc()).all()

    md_content = "# AI Activity Timeline\n\n"

    current_date = None
    for event in events:
        event_date = event.timestamp.strftime('%Y-%m-%d')

        if event_date != current_date:
            current_date = event_date
            day_name = event.timestamp.strftime('%A')
            md_content += f"\n## {event_date} ({day_name})\n"

        time_str = event.timestamp.strftime('%H:%M')
        md_content += f"\n### {time_str} — {event.tool}: {event.title}\n"
        md_content += f"- **Topics:** {event.topics or 'general'}\n"
        md_content += f"- **Duration:** {event.duration_minutes} min\n"
        md_content += f"- **Tokens:** {event.tokens_used}\n"
        md_content += f"- **Summary:** {event.summary}\n"

    return StreamingResponse(
        iter([md_content]),
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=timeline-summary.md"}
    )
