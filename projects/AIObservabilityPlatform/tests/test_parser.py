import json
from datetime import datetime
from pathlib import Path
from backend.parsers.utils import (
    extract_title_from_messages,
    extract_keywords,
    parse_iso_datetime
)

def test_extract_title_from_messages():
    messages = [
        {'role': 'user', 'content': 'How do I implement RAG with vector databases?'},
        {'role': 'assistant', 'content': 'RAG stands for Retrieval-Augmented Generation...'}
    ]
    title = extract_title_from_messages(messages)
    assert 'RAG' in title or 'vector' in title.lower()

def test_extract_keywords():
    text = "We discussed Embeddings, Vector Databases, and Retrieval systems for RAG applications"
    keywords = extract_keywords(text, top_n=3)
    assert len(keywords) > 0
    assert any('Vector' in kw or 'Retrieval' in kw or 'Embeddings' in kw for kw in keywords)

def test_parse_iso_datetime():
    iso_str = "2026-05-13T10:30:00Z"
    dt = parse_iso_datetime(iso_str)
    assert dt.year == 2026
    assert dt.month == 5
    assert dt.day == 13
