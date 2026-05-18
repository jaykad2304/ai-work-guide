#!/usr/bin/env python3
"""Regenerate summaries for all historical sessions using improved extraction."""
import json
import sys
from pathlib import Path
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import SessionLocal
from backend.models import Event
from backend.parsers.utils import build_claude_summary


def regenerate_all_summaries():
    """Regenerate summaries for all events using improved extraction."""
    db = SessionLocal()
    try:
        events = db.query(Event).all()
        total = len(events)
        updated = 0

        print(f"\n📊 Regenerating summaries for {total} sessions...\n")

        for idx, event in enumerate(events, 1):
            if not event.raw_content:
                continue

            try:
                payload = json.loads(event.raw_content)
                messages = payload.get('messages', [])

                if messages:
                    new_summary = build_claude_summary(messages)
                    if new_summary != event.summary:
                        event.summary = new_summary
                        updated += 1
                        status = "✓" if idx % 5 == 0 else ""
                        if status:
                            print(f"  [{idx}/{total}] Updated: {event.title[:50]}")
            except Exception as e:
                print(f"  ✗ Error processing {event.session_id}: {str(e)}")

        db.commit()
        print(f"\n✅ Done! Updated {updated}/{total} sessions with improved summaries.\n")

    finally:
        db.close()


if __name__ == '__main__':
    regenerate_all_summaries()
