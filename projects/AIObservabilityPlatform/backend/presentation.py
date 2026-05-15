import json
import os
import re
import time
from typing import Iterable


TOOL_LABELS = {
    'claude_cli': 'Claude CLI',
    'codex_cli': 'Codex CLI',
    'claude_web': 'Claude Web',
    'chatgpt': 'ChatGPT',
}

ACTIVE_SESSION_SECONDS = 120
SUMMARY_PENDING_TEXT = 'Session in progress—summary will be generated when complete.'


def tool_label(tool: str) -> str:
    return TOOL_LABELS.get(tool, tool.replace('_', ' ') if tool else 'AI Tool')


def event_topics(event) -> list[str]:
    if not getattr(event, 'topics', None):
        return []
    ignored = {
        'what', 'yo', 'sure', 'hi', 'hey', 'good', 'ai', 'claude',
        'you', 'your', 'use', 'using', 'used', 'skill', 'skills',
        'github', 'codex', 'chatgpt', 'default', 'mode'
    }
    return [
        topic.strip() for topic in event.topics.split(',')
        if topic.strip() and topic.strip().lower() not in ignored
    ]


def summary_status(event) -> str:
    return 'active' if is_active_session(event) else 'ready'


def is_active_session(event) -> bool:
    raw_content = getattr(event, 'raw_content', None)
    if not raw_content:
        return False
    try:
        payload = json.loads(raw_content)
    except Exception:
        return False

    if payload.get('summary_status') == 'active':
        return True
    if payload.get('summary_status') == 'ready':
        return False

    file_path = payload.get('file')
    if not file_path:
        return False
    try:
        modified_at = os.path.getmtime(file_path)
    except OSError:
        return False
    return (time.time() - modified_at) <= ACTIVE_SESSION_SECONDS


def build_display_summary(event) -> str:
    if is_active_session(event):
        return SUMMARY_PENDING_TEXT

    summary = _clean(getattr(event, 'summary', '') or '')
    title = _clean(getattr(event, 'title', '') or '')
    project = _clean(getattr(event, 'project', '') or '')
    topics = event_topics(event)
    context = _extract_transcript_context(getattr(event, 'raw_content', None))
    transcript = context.get('combined', '')
    user_prompt = context.get('user_prompt', '')
    assistant_reply = context.get('assistant_reply', '')

    best_source = _pick_best_source([assistant_reply, summary, user_prompt, transcript, title])
    action = _derive_action(best_source, topics)

    details = []
    if project and project != 'unknown':
        details.append(f'in {project}')
    if topics:
        details.append(f'around {", ".join(topics[:3])}')

    sentence = f'{action} using {tool_label(getattr(event, "tool", ""))}'
    if details:
        sentence += f' {" ".join(details)}'
    sentence = sentence.strip()

    achievements = _extract_achievements(' '.join([assistant_reply, summary, transcript, user_prompt]))
    if achievements:
        sentence = f'{sentence}. Did: {"; ".join(achievements[:2])}.'
    else:
        outcome = _derive_outcome(best_source)
        if outcome:
            sentence = f'{sentence}. {outcome}'

    return _trim_sentences(sentence, max_chars=260)


def build_token_hint(event) -> str:
    tokens = getattr(event, 'tokens_used', 0) or 0
    source = ' '.join([
        _clean(getattr(event, 'summary', '') or ''),
        _clean(getattr(event, 'title', '') or ''),
        ' '.join(event_topics(event))
    ]).lower()

    if tokens >= 2500:
        return 'Break large asks into checkpoints and request a plan before full implementation to reduce repeat context.'
    if tokens >= 1200:
        return 'Point to the exact files and expected output first so the assistant can respond in fewer turns.'
    if any(word in source for word in ['debug', 'error', 'bug', 'trace']):
        return 'Include the failing command and the exact error first to avoid exploratory back-and-forth.'
    if any(word in source for word in ['ui', 'layout', 'react', 'component', 'design']):
        return 'Attach the component name and a screenshot together so layout fixes can happen in one pass.'
    if any(word in source for word in ['api', 'endpoint', 'integration']):
        return 'Provide the request shape and expected response up front so the integration can be scoped tightly.'
    return 'Start with the concrete outcome, the relevant files, and constraints so the assistant needs less context gathering.'


def _pick_best_source(sources: Iterable[str]) -> str:
    for source in sources:
        cleaned = _clean_observability_text(source or '')
        if cleaned and not _is_generic(cleaned) and not _is_noise_fragment(cleaned):
            return cleaned
    for source in sources:
        cleaned = _clean_observability_text(source or '')
        if cleaned:
            return cleaned
    return ''


def _extract_transcript_context(raw_content: str | None) -> dict[str, str]:
    if not raw_content:
        return {'combined': '', 'user_prompt': '', 'assistant_reply': ''}
    try:
        payload = json.loads(raw_content)
    except Exception:
        return {'combined': '', 'user_prompt': '', 'assistant_reply': ''}

    messages = payload.get('messages')
    if isinstance(messages, list):
        parts = []
        user_prompt = ''
        assistant_reply = ''
        for message in messages:
            if not isinstance(message, dict):
                continue
            role = message.get('role')
            content = message.get('content', [])
            extracted = []
            if isinstance(content, str):
                extracted.append(content)
            elif isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get('text'):
                        extracted.append(item['text'])
            text = _clean_observability_text(' '.join(extracted))
            if not text:
                continue
            parts.append(text)
            if role == 'user' and not user_prompt and _is_meaningful_prompt(text):
                user_prompt = text
            if role == 'assistant' and text and not _looks_like_greeting(text):
                assistant_reply = text
        return {
            'combined': _clean(' '.join(parts[:6])),
            'user_prompt': user_prompt,
            'assistant_reply': assistant_reply,
        }

    excerpt = _clean_observability_text(payload.get('excerpt') or '')
    assistant_summary = _clean_observability_text(payload.get('assistant_summary') or '')
    combined = _clean(' '.join([excerpt, assistant_summary]))
    return {
        'combined': combined,
        'user_prompt': excerpt,
        'assistant_reply': assistant_summary,
    }


def _derive_action(source: str, topics: list[str]) -> str:
    lowered = source.lower()

    if any(word in lowered for word in ['fix', 'debug', 'error', 'broken', 'issue']):
        return f'Debugged and fixed {topics[0] if topics else "an implementation issue"}'
    if any(word in lowered for word in ['build', 'implement', 'add', 'create']):
        return f'Implemented {topics[0] if topics else "a new capability"}'
    if any(word in lowered for word in ['review', 'understand', 'explain', 'history']):
        return f'Reviewed and analyzed {topics[0] if topics else "existing project context"}'
    if any(word in lowered for word in ['design', 'ui', 'layout', 'dashboard', 'theme', 'font', 'feed']):
        return f'Refined the UI and presentation for {topics[0] if topics else "the current project"}'
    return f'Advanced {topics[0] if topics else "the current task"}'


def _derive_outcome(source: str) -> str:
    cleaned = _clean(source)
    if not cleaned:
        return ''

    cleaned = re.sub(r'^(that depends on.*?:|hi [^!]+!|hey[^!]*!|i am .*?\.|i’m .*?\.)\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\*\*', '', cleaned)
    cleaned = _clean_observability_text(cleaned)
    cleaned = cleaned.lstrip('-:,. ')
    if not cleaned or _is_noise_fragment(cleaned):
        return ''

    if len(cleaned) > 130:
        cleaned = cleaned[:130].rsplit(' ', 1)[0]

    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]

    if cleaned.endswith('.'):
        return f'Outcome: {cleaned}'
    return f'Outcome: {cleaned}.'


def _extract_achievements(source: str) -> list[str]:
    cleaned = _clean_observability_text(source)
    if not cleaned:
        return []

    sentence_parts = re.split(r'(?<=[.!?])\s+|(?:\s+-\s+)', cleaned)
    achievements = []
    action_words = (
        'added', 'implemented', 'updated', 'changed', 'fixed', 'removed',
        'created', 'generated', 'installed', 'validated', 'verified',
        'built', 'refined', 'adjusted', 'cleaned', 'wired', 'passed',
        'made', 'converted', 'simplified', 'highlighted'
    )
    banned = (
        'collaboration mode', 'default mode', 'previous instructions',
        'knowledge cutoff', 'current date', 'you are now', 'sandbox',
        'developer instruction', 'system message', 'tool call',
        'what happened', 'can you', 'could you', 'do you',
        'i’m ', "i'm ", 'i am ', 'i’ll ', "i'll ", 'checking the repo',
        'picking up from', 'interrupted reset flow', 'skill is a set',
        'generate or edit raster', 'use when codex', 'available skills',
        'trigger when', 'description:', 'file:', 'plugin'
    )

    for part in sentence_parts:
        candidate = _clean(part)
        if len(candidate) < 18:
            continue
        lowered = candidate.lower()
        if any(term in lowered for term in banned) or _is_noise_fragment(candidate):
            continue
        if not any(word in lowered for word in action_words):
            continue
        candidate = re.sub(r'^(done|implemented|updated|changed|fixed|added)\s*[-—:]?\s*', '', candidate, flags=re.IGNORECASE)
        candidate = candidate[:95].rsplit(' ', 1)[0].strip(' .,;:')
        if candidate and candidate.lower() not in {item.lower() for item in achievements}:
            achievements.append(candidate)
        if len(achievements) == 3:
            break

    return achievements


def _clean(text: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', text or '')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _clean_observability_text(text: str) -> str:
    cleaned = _clean(text)
    if not cleaned:
        return ''

    cut_markers = [
        '<turn_aborted>',
        '<environment_context>',
        '<permissions instructions>',
        '<collaboration_mode>',
        'Collaboration Mode:',
        'You are now in Default mode',
        'Any previous instructions for other modes',
        'Knowledge cutoff:',
        'Current date:',
    ]
    for marker in cut_markers:
        idx = cleaned.lower().find(marker.lower())
        if idx >= 0:
            cleaned = cleaned[:idx].strip()

    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    cleaned = re.sub(r'\b(system|developer|analysis|commentary|final)\s*[:=]\s*', ' ', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b[a-z0-9_-]+:\s+(generate|use|install|create|triage|inspect|debug|publish)\b.*', ' ', cleaned, flags=re.IGNORECASE)
    return _clean(cleaned)


def _is_noise_fragment(text: str) -> bool:
    lowered = _clean(text).lower()
    if not lowered:
        return True
    noise_terms = (
        'collaboration mode', 'default mode', 'previous instructions',
        'you are now in default mode', 'available skills', 'skill is a set',
        'generate or edit raster', 'use when codex', 'trigger when',
        'i’m picking up', "i'm picking up", 'checking the repo state',
        'interrupted reset flow', 'filesystem sandboxing', 'developer message',
        'personality', 'knowledge cutoff', 'current date'
    )
    if any(term in lowered for term in noise_terms):
        return True
    if re.match(r'^worked on .+ using (codex|claude|chatgpt).+ around .+', lowered):
        return True
    if re.match(r'^(i’m|i\'m|i am|i’ll|i\'ll|let me|i will|i’m going to)\b', lowered):
        return True
    return False


def _is_generic(text: str) -> bool:
    lowered = text.lower().strip()
    return lowered in {
        '',
        'untitled',
        'session completed',
        'codex cli session',
    } or lowered.startswith('codex session ')


def _looks_like_greeting(text: str) -> bool:
    lowered = text.lower()
    return lowered.startswith(('hi ', 'hello ', 'hey ', 'good to be here', 'what can i help'))


def _is_meaningful_prompt(text: str) -> bool:
    lowered = text.lower().strip()
    if lowered in {'hi', 'hello', 'hey', 'yo'}:
        return False
    if lowered.startswith(('hi ', 'hello ', 'hey ', 'yo ')):
        return False
    return len(lowered) > 12


def _trim_sentences(text: str, max_chars: int = 600) -> str:
    if len(text) <= max_chars:
        return text
    clipped = text[:max_chars].rsplit(' ', 1)[0].rstrip(' .,;:')
    return f'{clipped}...'
