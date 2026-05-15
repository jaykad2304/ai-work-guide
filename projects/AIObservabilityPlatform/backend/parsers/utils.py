import json
from pathlib import Path
from datetime import datetime
import re
from collections import Counter

STOPWORDS = {
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'your', 'about',
    'what', 'when', 'where', 'which', 'would', 'could', 'should', 'there', 'their',
    'them', 'they', 'then', 'than', 'into', 'after', 'before', 'using', 'used',
    'sure', 'yeah', 'okay', 'good', 'great', 'hello', 'hi', 'hey', 'yo', 'just',
    'want', 'like', 'looks', 'look', 'help', 'need', 'here', 'session', 'project',
    'code', 'work', 'working', 'done', 'doing', 'assistant', 'claude', 'anthropic',
}

GREETING_PREFIXES = (
    'hi ', 'hello ', 'hey ', 'yo ', 'good to be here', "i'm claude", 'i am claude',
    'what can i help', 'sure, go ahead', 'that depends on what you mean'
)


def clean_text(text):
    return re.sub(r'\s+', ' ', str(text).replace('\n', ' ')).strip()


def extract_text_parts_from_content(content):
    if isinstance(content, str):
        cleaned = clean_text(content)
        return [cleaned] if cleaned else []

    parts = []
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and item.get('text'):
                cleaned = clean_text(item['text'])
                if cleaned:
                    parts.append(cleaned)
    return parts

def extract_tokens_from_message(message):
    """Rough estimate of token count from text length"""
    return max(1, len(message.get('content', '')) // 4)

def extract_title_from_messages(messages):
    """Extract title from the first meaningful user message"""
    for msg in messages:
        if msg.get('role') == 'user':
            text = ' '.join(extract_text_parts_from_content(msg.get('content', '')))
            if not is_meaningful_text(text):
                continue
            title = text[:60].replace('\n', ' ').strip()
            if not title.endswith('?'):
                title = title.split('.')[0]
            return title if title else 'Untitled'
    return 'Untitled'

def extract_keywords(text, top_n=5):
    """Extract keywords from text using simple frequency filtering."""
    tokens = re.findall(r'\b[a-zA-Z][a-zA-Z0-9_\-]{2,}\b', text.lower())
    normalized = []
    for token in tokens:
        if token in STOPWORDS:
            continue
        if token.isdigit():
            continue
        normalized.append(token)
    counter = Counter(normalized)
    return [word.title() if word.upper() != word else word for word, _ in counter.most_common(top_n)]


def is_meaningful_text(text):
    lowered = clean_text(text).lower()
    if len(lowered) < 12:
        return False
    return not lowered.startswith(GREETING_PREFIXES)


def extract_conversation_text(messages):
    user_texts = []
    assistant_texts = []
    combined = []

    for msg in messages:
        role = msg.get('role')
        text = ' '.join(extract_text_parts_from_content(msg.get('content', '')))
        if not text:
            continue
        combined.append(text)
        if role == 'user' and is_meaningful_text(text):
            user_texts.append(text)
        if role == 'assistant' and is_meaningful_text(text):
            assistant_texts.append(text)

    return {
        'combined': ' '.join(combined),
        'user_prompt': user_texts[0] if user_texts else '',
        'assistant_summary': assistant_texts[-1] if assistant_texts else '',
    }


def extract_achievements_from_messages(messages):
    """Extract concrete work items from conversation."""
    parts = []
    for msg in messages:
        if msg.get('role') == 'assistant':
            parts.extend(extract_text_parts_from_content(msg.get('content', '')))
    combined = ' '.join(parts)

    action_verbs = ('added', 'implemented', 'updated', 'fixed', 'removed', 'created',
                   'refactored', 'optimized', 'debugged', 'improved', 'designed',
                   'built', 'integrated', 'configured', 'deployed')

    sentences = re.split(r'[.!?]\s+', combined)
    achievements = []

    for sent in sentences:
        lowered = sent.lower().strip()
        if not lowered or len(lowered) < 15:
            continue
        if any(verb in lowered for verb in action_verbs):
            cleaned = sent[:80].strip()
            if cleaned and cleaned not in achievements:
                achievements.append(cleaned)
            if len(achievements) >= 2:
                break

    return achievements


def build_claude_summary(messages):
    """Build structured summary from conversation facts (achievements extraction)."""
    context = extract_conversation_text(messages)
    assistant = context['assistant_summary']
    achievements = extract_achievements_from_messages(messages)

    if achievements:
        return '. '.join(achievements)

    if assistant:
        return assistant

    return 'Session completed'

def parse_iso_datetime(date_str):
    """Parse ISO 8601 datetime string"""
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        return datetime.utcnow()
