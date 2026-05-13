from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json

Base = declarative_base()

class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    tool = Column(String(50), nullable=False, index=True)
    session_id = Column(String(255), unique=True, nullable=False)
    title = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    topics = Column(String(500), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    raw_content = Column(Text, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    indexed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'tool': self.tool,
            'session_id': self.session_id,
            'title': self.title,
            'summary': self.summary,
            'topics': self.topics.split(',') if self.topics else [],
            'tokens_used': self.tokens_used,
            'duration_minutes': self.duration_minutes
        }

class DailyMetadata(Base):
    __tablename__ = 'daily_metadata'

    date = Column(String(10), primary_key=True, index=True)
    total_events = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    tools_used = Column(String(255), nullable=True)
    primary_topics = Column(String(500), nullable=True)
    activity_score = Column(Float, default=0.0)
    daily_summary = Column(Text, nullable=True)
    peak_hour = Column(Integer, nullable=True)
    longest_session_id = Column(String(255), nullable=True)

    def to_dict(self):
        return {
            'date': self.date,
            'total_events': self.total_events,
            'total_tokens': self.total_tokens,
            'tools_used': self.tools_used.split(',') if self.tools_used else [],
            'primary_topics': self.primary_topics.split(',') if self.primary_topics else [],
            'activity_score': self.activity_score,
            'daily_summary': self.daily_summary,
            'peak_hour': self.peak_hour
        }

class Insight(Base):
    __tablename__ = 'insights'

    id = Column(Integer, primary_key=True, index=True)
    insight_type = Column(String(50), nullable=False, index=True)
    content = Column(Text, nullable=False)
    confidence = Column(Float, default=0.0)
    related_topics = Column(String(500), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.insight_type,
            'content': self.content,
            'confidence': self.confidence,
            'related_topics': self.related_topics.split(',') if self.related_topics else []
        }
