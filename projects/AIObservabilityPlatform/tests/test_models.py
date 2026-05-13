from datetime import datetime
from backend.models import Event, DailyMetadata, Insight

def test_event_model():
    event = Event(
        timestamp=datetime.utcnow(),
        tool='claude_cli',
        session_id='session-123',
        title='RAG Design',
        summary='Discussed vector databases',
        topics='RAG,embeddings',
        tokens_used=1500,
        duration_minutes=15,
        raw_content='{}'
    )
    assert event.title == 'RAG Design'
    assert event.tool == 'claude_cli'
    event_dict = event.to_dict()
    assert event_dict['topics'] == ['RAG', 'embeddings']

def test_daily_metadata_model():
    metadata = DailyMetadata(
        date='2026-05-13',
        total_events=5,
        total_tokens=7500,
        tools_used='claude_cli,claude_web',
        primary_topics='RAG,payments',
        activity_score=85.5,
        peak_hour=14
    )
    assert metadata.activity_score == 85.5
    meta_dict = metadata.to_dict()
    assert meta_dict['tools_used'] == ['claude_cli', 'claude_web']

def test_insight_model():
    insight = Insight(
        insight_type='pattern',
        content='User discusses RAG every Tuesday',
        confidence=92.5,
        related_topics='RAG,embeddings'
    )
    assert insight.insight_type == 'pattern'
    insight_dict = insight.to_dict()
    assert insight_dict['confidence'] == 92.5
