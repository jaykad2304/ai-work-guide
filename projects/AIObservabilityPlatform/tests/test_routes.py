from datetime import datetime
from backend.models import Event
import json

def test_get_timeline(client, test_db):
    """Test timeline endpoint"""
    event = Event(
        timestamp=datetime.utcnow(),
        tool='claude_cli',
        session_id='test-session-1',
        title='Test Session',
        summary='Test summary',
        topics='test',
        tokens_used=100,
        duration_minutes=5,
        raw_content='{}'
    )
    test_db.add(event)
    test_db.commit()

    response = client.get("/timeline?days=30")
    assert response.status_code == 200
    data = response.json()
    assert data['total_events'] >= 1
    assert len(data['events']) >= 1

def test_search(client, test_db):
    """Test search endpoint"""
    event = Event(
        timestamp=datetime.utcnow(),
        tool='claude_cli',
        session_id='test-session-2',
        title='RAG System Design',
        summary='Discussed vector databases',
        topics='RAG,embeddings',
        tokens_used=100,
        duration_minutes=5,
        raw_content='{}'
    )
    test_db.add(event)
    test_db.commit()

    response = client.get("/search?q=RAG")
    assert response.status_code == 200
    data = response.json()
    assert data['results_count'] >= 1

def test_stats(client, test_db):
    """Test statistics endpoint"""
    event = Event(
        timestamp=datetime.utcnow(),
        tool='claude_cli',
        session_id='test-session-3',
        title='Test',
        summary='Test',
        topics='test',
        tokens_used=1000,
        duration_minutes=10,
        raw_content='{}'
    )
    test_db.add(event)
    test_db.commit()

    response = client.get("/insights/stats")
    assert response.status_code == 200
    data = response.json()
    assert data['total_sessions'] >= 1
    assert data['total_tokens'] >= 1000
