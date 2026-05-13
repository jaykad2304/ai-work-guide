#!/usr/bin/env python
"""
AI Observability Daemon — watches session directories for all configured collectors.
Auto-triggers rescan when new session files are detected.

Run: python daemon.py
"""
import time
import requests
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BACKEND_URL = "http://localhost:8000"


class SessionFileHandler(FileSystemEventHandler):
    def __init__(self, collector_name):
        self.collector_name = collector_name
        self.last_trigger = 0

    def on_created(self, event):
        if not event.is_directory and (event.src_path.endswith('.json') or event.src_path.endswith('.jsonl')):
            self._trigger_rescan()

    def on_modified(self, event):
        if not event.is_directory and (event.src_path.endswith('.json') or event.src_path.endswith('.jsonl')):
            self._trigger_rescan()

    def _trigger_rescan(self):
        # Debounce: only trigger once per second
        now = time.time()
        if now - self.last_trigger < 1:
            return
        self.last_trigger = now

        try:
            r = requests.post(f"{BACKEND_URL}/rescan", timeout=10)
            if r.status_code == 200:
                data = r.json()
                total = data.get('total_events', 0)
                if total > 0:
                    by_tool = data.get('by_tool', {})
                    print(f"[daemon] rescanned: total={total} {by_tool}")
        except Exception as e:
            print(f"[daemon] rescan failed: {e}")


def main():
    print("[daemon] loading collectors...")
    from backend.collectors.registry import load_collectors

    collectors = load_collectors()
    observer = Observer()

    for collector in collectors:
        for path in collector.watch_paths:
            if path.exists():
                handler = SessionFileHandler(collector.tool_name)
                observer.schedule(handler, str(path), recursive=True)
                print(f"[daemon] watching {path} for {collector.tool_name}")
            else:
                print(f"[daemon] {path} not found, skipping {collector.tool_name}")

    observer.start()
    print("[daemon] running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[daemon] stopping...")
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
