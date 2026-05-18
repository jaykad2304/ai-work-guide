import json
from datetime import datetime
from pathlib import Path
from backend.parsers.utils import (
    extract_title_from_messages,
    extract_keywords,
    parse_iso_datetime,
    extract_conversation_text,
    build_claude_summary,
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
    assert any('Vector' in kw or 'Retrieval' in kw or 'Embeddings' in kw or 'Rag' in kw for kw in keywords)

def test_parse_iso_datetime():
    iso_str = "2026-05-13T10:30:00Z"
    dt = parse_iso_datetime(iso_str)
    assert dt.year == 2026
    assert dt.month == 5
    assert dt.day == 13


def test_extract_conversation_text_skips_greetings():
    messages = [
        {'role': 'assistant', 'content': 'Hi Jay! What can I help with today?'},
        {'role': 'user', 'content': 'I want to improve session summaries in the dashboard UI.'},
        {'role': 'assistant', 'content': 'I updated the digest generation and cleaned the summary cards.'},
    ]
    context = extract_conversation_text(messages)
    assert context['user_prompt'].startswith('I want to improve')
    assert 'What can I help' not in context['assistant_summary']


def test_build_claude_summary_prefers_meaningful_assistant_text():
    messages = [
        {'role': 'assistant', 'content': 'Hello!'},
        {'role': 'user', 'content': 'Can you improve AI history for this folder?'},
        {'role': 'assistant', 'content': 'I added a CLI history command and connected it to project-scoped session digests.'},
    ]
    summary = build_claude_summary(messages)
    assert 'CLI history command' in summary
