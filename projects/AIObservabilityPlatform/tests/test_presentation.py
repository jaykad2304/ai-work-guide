from datetime import datetime

from backend.models import Event
from backend.presentation import SUMMARY_PENDING_TEXT, build_display_summary, build_token_hint, summary_status


def test_build_display_summary_uses_summary_and_project():
    event = Event(
        timestamp=datetime.utcnow(),
        tool='codex_cli',
        session_id='session-a',
        project='AIObservabilityPlatform',
        title='Codex session 1234',
        summary='Improved dashboard readability, session cards, and project-level summaries.',
        topics='UI,Dashboard,React',
        tokens_used=1800,
        duration_minutes=12,
        raw_content='{}'
    )

    digest = build_display_summary(event)
    assert 'AIObservabilityPlatform' in digest
    assert 'Codex CLI' in digest
    assert 'UI' in digest or 'dashboard' in digest.lower()


def test_build_token_hint_reacts_to_debug_sessions():
    event = Event(
        timestamp=datetime.utcnow(),
        tool='claude_cli',
        session_id='session-b',
        title='Fix auth bug',
        summary='Debugged a broken authentication flow and traced the stack error.',
        topics='Security,Debugging',
        tokens_used=700,
        duration_minutes=6,
        raw_content='{}'
    )

    hint = build_token_hint(event)
    assert 'error' in hint.lower() or 'failing command' in hint.lower()


def test_build_display_summary_filters_system_noise_and_keeps_achievements():
    event = Event(
        timestamp=datetime.utcnow(),
        tool='codex_cli',
        session_id='session-c',
        project='AIObservabilityPlatform',
        title='Worked on Dashboard using Codex CLI in AIObservabilityPlatform around Dashboard, Use',
        summary='Added semantic status colors. Highlighted the Session Feed as the primary output. Collaboration Mode: Default You are now in Default mode.',
        topics='Dashboard,UI,Use',
        tokens_used=4200,
        duration_minutes=42,
        raw_content='{"excerpt":"Can we make the dashboard better? Collaboration Mode: Default You are now in Default mode.","assistant_summary":"Added semantic status colors. Highlighted the Session Feed as the primary output. Validated the frontend build."}'
    )

    digest = build_display_summary(event)

    assert 'Collaboration Mode' not in digest
    assert 'Default mode' not in digest
    assert digest.startswith('Implemented')
    assert 'semantic status colors' in digest or 'Session Feed' in digest


def test_active_session_returns_pending_summary():
    event = Event(
        timestamp=datetime.utcnow(),
        tool='codex_cli',
        session_id='session-active',
        project='AIObservabilityPlatform',
        title='Current active task',
        summary='Partial noisy transcript should not be shown yet.',
        topics='Dashboard',
        tokens_used=300,
        duration_minutes=3,
        raw_content='{"summary_status":"active","excerpt":"unfinished work"}'
    )

    assert summary_status(event) == 'active'
    assert build_display_summary(event) == SUMMARY_PENDING_TEXT


def test_build_display_summary_rejects_progress_notes_and_skill_catalog_noise():
    event = Event(
        timestamp=datetime.utcnow(),
        tool='codex_cli',
        session_id='session-noise',
        project='AIObservabilityPlatform',
        title='Worked on Skill using Codex CLI in AIObservabilityPlatform around Skill, Github, You',
        summary='I’m picking up from the interrupted reset flow and checking the repo state first so I can. imagegen: Generate or edit raster images when the task benefits from bitmap visuals.',
        topics='Skill,Github,You',
        tokens_used=6400,
        duration_minutes=64,
        raw_content='{"assistant_summary":"I’m picking up from the interrupted reset flow and checking the repo state first so I can. imagegen: Generate or edit raster images when the task benefits from bitmap visuals."}'
    )

    digest = build_display_summary(event)

    assert 'imagegen' not in digest.lower()
    assert 'picking up' not in digest.lower()
    assert 'interrupted reset flow' not in digest.lower()
    assert 'around Skill' not in digest
    assert 'AIObservabilityPlatform' in digest
