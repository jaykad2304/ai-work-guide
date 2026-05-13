from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database import get_db
from backend.models import Insight, Event
from collections import Counter

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/patterns")
async def get_patterns(db: Session = Depends(get_db)):
    """Get detected patterns from user's AI usage"""
    insights = db.query(Insight)\
        .filter(Insight.insight_type == 'pattern')\
        .order_by(desc(Insight.confidence))\
        .all()

    return {
        "type": "patterns",
        "patterns": [i.to_dict() for i in insights]
    }

@router.get("/recommendations")
async def get_recommendations(db: Session = Depends(get_db)):
    """Get AI-generated recommendations"""
    insights = db.query(Insight)\
        .filter(Insight.insight_type == 'recommendation')\
        .order_by(desc(Insight.confidence))\
        .all()

    return {
        "type": "recommendations",
        "recommendations": [i.to_dict() for i in insights]
    }

@router.get("/stats")
async def get_statistics(db: Session = Depends(get_db)):
    """Get overall statistics"""
    total_events = db.query(Event).count()
    all_events = db.query(Event).all()
    total_tokens = sum(e.tokens_used or 0 for e in all_events)

    tools = db.query(Event.tool).all()
    tool_counts = Counter([t[0] for t in tools])

    all_topics = []
    for event in all_events:
        if event.topics:
            all_topics.extend(event.topics.split(','))
    topic_counts = Counter(all_topics)

    return {
        "total_sessions": total_events,
        "total_tokens": total_tokens,
        "most_used_tools": dict(tool_counts.most_common(5)),
        "favorite_topics": dict(topic_counts.most_common(10))
    }
