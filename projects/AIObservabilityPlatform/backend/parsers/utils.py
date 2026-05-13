import json
from pathlib import Path
from datetime import datetime
import re

def extract_tokens_from_message(message):
    """Rough estimate of token count from text length"""
    return max(1, len(message.get('content', '')) // 4)

def extract_title_from_messages(messages):
    """Extract title from first user message"""
    for msg in messages:
        if msg.get('role') == 'user':
            content = msg.get('content', '')
            title = content[:60].replace('\n', ' ').strip()
            if not title.endswith('?'):
                title = title.split('.')[0]
            return title if title else 'Untitled'
    return 'Untitled'

def extract_keywords(text, top_n=5):
    """Extract keywords from text using simple regex"""
    words = re.findall(r'\b[A-Z][a-zA-Z]+\b', text)
    from collections import Counter
    counter = Counter(words)
    return [word for word, _ in counter.most_common(top_n)]

def parse_iso_datetime(date_str):
    """Parse ISO 8601 datetime string"""
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        return datetime.utcnow()
