#!/usr/bin/env python3
import argparse
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.presentation import build_display_summary, event_topics, tool_label


@dataclass
class EventView:
    tool: str
    session_id: str
    project: Optional[str]
    title: Optional[str]
    summary: Optional[str]
    topics: Optional[str]
    tokens_used: Optional[int]
    duration_minutes: Optional[int]
    raw_content: Optional[str]
    timestamp: str


def parse_args():
    parser = argparse.ArgumentParser(description='Show AI session history for the current folder or a chosen project.')
    parser.add_argument('--db', default=str(PROJECT_ROOT / 'data' / 'timeline.db'))
    parser.add_argument('--project', help='Project name override.')
    parser.add_argument('--path', help='Directory to resolve. Defaults to the current working directory.')
    parser.add_argument('--days', type=int, default=30, help='How many recent days to include. Default: 30')
    parser.add_argument('--limit', type=int, default=5, help='Maximum number of sessions to print. Default: 5')
    parser.add_argument('--json', action='store_true', help='Output JSON-like plain text rows for scripting.')
    parser.add_argument('--facts', action='store_true', help='Show raw summary/facts instead of narrative.')
    return parser.parse_args()


def resolve_project_name(conn: sqlite3.Connection, cwd: Path, explicit_project: Optional[str]) -> Optional[str]:
    if explicit_project:
        return explicit_project

    known_projects = {row[0] for row in conn.execute("select distinct project from events where project is not null and project != ''")}
    for candidate in [cwd, *cwd.parents]:
        if candidate.name in known_projects:
            return candidate.name
    return cwd.name if cwd.name else None


def fetch_events(conn: sqlite3.Connection, project: str, days: int, limit: int) -> list[EventView]:
    rows = conn.execute(
        """
        select tool, session_id, project, title, summary, topics, tokens_used, duration_minutes, raw_content, timestamp
        from events
        where project = ?
          and timestamp >= datetime('now', ?)
        order by timestamp desc
        limit ?
        """,
        (project, f'-{days} days', limit)
    ).fetchall()

    return [EventView(*row) for row in rows]


def print_human(project: str, cwd: Path, events: list[EventView], days: int, show_facts: bool = False):
    print(f'📊 AI History: {project}')
    print(f'📁 Folder: {cwd}')
    print(f'📅 Window: last {days} days')
    if show_facts:
        print('📋 Mode: Raw facts/summary')
    print()

    if not events:
        print('No tracked sessions found for this folder in the selected time window.')
        return

    for idx, event in enumerate(events, start=1):
        digest = build_display_summary(event)
        topics = event_topics(event)

        # Show session entry with number and summary
        print(f'{idx}. {digest}')

        if show_facts and event.summary:
            print(f'   💡 Summary: {event.summary}')

        # Show metadata in compact format
        tokens_display = f"{(event.tokens_used or 0):,}" if event.tokens_used else "0"
        duration = event.duration_minutes or 1
        date_str = str(event.timestamp)[:10]

        print(f'   ⚡ {tokens_display} tokens  |  ⏱️  {duration}m  |  📅 {date_str}  |  🔧 {tool_label(event.tool)}')

        if topics:
            topics_str = ", ".join(topics[:4])
            print(f'   🏷️  {topics_str}')
        print()


def print_jsonish(events: list[EventView]):
    for event in events:
        print({
            'tool': event.tool,
            'project': event.project,
            'timestamp': event.timestamp,
            'tokens_used': event.tokens_used or 0,
            'duration_minutes': event.duration_minutes or 1,
            'display_summary': build_display_summary(event),
        })


def main():
    args = parse_args()
    cwd = Path(args.path or Path.cwd()).resolve()
    conn = sqlite3.connect(args.db)
    try:
        project = resolve_project_name(conn, cwd, args.project)
        if not project:
            raise SystemExit('Could not resolve a project name for this folder.')

        events = fetch_events(conn, project, args.days, args.limit)
    finally:
        conn.close()

    if args.json:
        print_jsonish(events)
    else:
        print_human(project, cwd, events, args.days, show_facts=args.facts)


if __name__ == '__main__':
    main()
