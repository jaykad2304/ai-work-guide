import yaml
from pathlib import Path
from typing import List
from backend.collectors import BaseCollector
from backend.collectors.claude_cli import ClaudeCliCollector
from backend.collectors.codex_cli import CodexCliCollector


BUILT_IN_COLLECTORS = {
    'claude_cli': ClaudeCliCollector,
    'codex_cli': CodexCliCollector,
}


def load_collectors() -> List[BaseCollector]:
    """Load enabled collectors from config, or return defaults."""
    config_path = Path(__file__).parent.parent.parent / 'collectors.yml'

    if not config_path.exists():
        # Default: both collectors enabled
        return [ClaudeCliCollector(), CodexCliCollector()]

    try:
        with open(config_path) as f:
            config = yaml.safe_load(f)

        collectors = []
        for entry in config.get('collectors', []):
            if not entry.get('enabled', True):
                continue
            name = entry.get('name')
            if name in BUILT_IN_COLLECTORS:
                collectors.append(BUILT_IN_COLLECTORS[name]())

        return collectors if collectors else [ClaudeCliCollector(), CodexCliCollector()]
    except Exception as e:
        print(f"[registry] error loading config: {e}, using defaults")
        return [ClaudeCliCollector(), CodexCliCollector()]
