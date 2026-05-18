#!/usr/bin/env python3
"""Re-parse all sessions from source .jsonl files to get untruncated data."""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import SessionLocal, init_db
from backend.collectors.registry import load_collectors

init_db()

db = SessionLocal()
try:
    print("\n📊 Re-parsing all sessions from source files...\n")

    collectors = load_collectors()
    total = 0
    by_tool = {}

    for collector in collectors:
        print(f"🔄 Syncing {collector.tool_name}...")
        new_events = collector.parse_all(db)
        by_tool[collector.tool_name] = len(new_events)
        total += len(new_events)
        if len(new_events) > 0:
            print(f"   ✓ Updated {len(new_events)} sessions")

    print(f"\n✅ Complete! Re-synced {total} total sessions with full content.\n")
    print(f"Summary by tool:")
    for tool, count in by_tool.items():
        print(f"  • {tool}: {count}")

finally:
    db.close()
