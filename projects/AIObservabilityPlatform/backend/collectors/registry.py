import yaml
from pathlib import Path
from typing import List
from backend.collectors import BaseCollector
from backend.collectors.claude_cli import ClaudeCliCollector
from backend.collectors.codex_cli import CodexCliCollector
from backend.collectors.external import (
    ExternalEventCollector,
    GitHubCopilotConnector,
    JulesConnector,
    VSCodeExtensionConnector,
)


BUILT_IN_COLLECTORS = {
    'claude_cli': ClaudeCliCollector,
    'codex_cli': CodexCliCollector,
    'external_events': ExternalEventCollector,
    'vscode_extension': VSCodeExtensionConnector,
    'github_copilot': GitHubCopilotConnector,
    'google_jules': JulesConnector,
}

DEFAULT_COLLECTORS = [ClaudeCliCollector, CodexCliCollector, ExternalEventCollector]
PLANNED_COLLECTORS = [VSCodeExtensionConnector, GitHubCopilotConnector, JulesConnector]


def load_collectors() -> List[BaseCollector]:
    """Load enabled collectors from config, or return defaults."""
    config_path = Path(__file__).parent.parent.parent / 'collectors.yml'

    if not config_path.exists():
        return [collector() for collector in DEFAULT_COLLECTORS]

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

        return collectors if collectors else [collector() for collector in DEFAULT_COLLECTORS]
    except Exception as e:
        print(f"[registry] error loading config: {e}, using defaults")
        return [collector() for collector in DEFAULT_COLLECTORS]


def connector_catalog() -> List[dict]:
    """Return supported and planned connector statuses for product/UI coverage."""
    seen = set()
    catalog = []
    for collector in [*load_collectors(), *[item() for item in PLANNED_COLLECTORS]]:
        if collector.tool_name in seen:
            continue
        seen.add(collector.tool_name)
        catalog.append(collector.coverage())
    return catalog
