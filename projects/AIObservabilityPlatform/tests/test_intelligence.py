from datetime import datetime, timedelta
from backend.intelligence.topic_extractor import TopicExtractor
from backend.intelligence.pattern_detector import PatternDetector
from backend.models import Event

def test_topic_extraction():
    extractor = TopicExtractor()

    text = "We discussed vector databases and retrieval augmented generation for RAG"
    topics = extractor.extract_topics(text)
    assert 'RAG' in topics or 'Database' in topics

    text2 = "How do I call an API endpoint?"
    topics2 = extractor.extract_topics(text2)
    assert 'APIs' in topics2

def test_topic_confidence():
    extractor = TopicExtractor()

    rag_text = "retrieval vector embedding search augmented generation"
    confidence = extractor.get_topic_confidence(rag_text, 'RAG')
    assert confidence > 50

    unrelated_text = "hello world"
    confidence2 = extractor.get_topic_confidence(unrelated_text, 'RAG')
    assert confidence2 == 0

def test_pattern_detection(test_db):
    base_time = datetime.utcnow()

    for i in range(3):
        event = Event(
            timestamp=base_time - timedelta(days=7-i*2, hours=14),
            tool='claude_cli',
            session_id=f'test-{i}',
            title=f'Session {i}',
            topics='RAG,database',
            tokens_used=100,
            duration_minutes=5,
            raw_content='{}'
        )
        test_db.add(event)
    test_db.commit()

    detector = PatternDetector(test_db)
    patterns = detector.detect_all_patterns()

    assert len(patterns) > 0
