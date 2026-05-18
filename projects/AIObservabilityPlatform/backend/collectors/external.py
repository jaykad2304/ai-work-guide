from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.collectors import BaseCollector
from backend.models import Event


class ExternalEventCollector(BaseCollector):
    """Marker collector for sources that push events through /api/events."""

    tool_name = 'external_events'
    display_name = 'External Event API'
    status = 'connector_ready'
    description = 'Accepts normalized events from VS Code extensions, browser extensions, CI jobs, or custom CLI wrappers.'
    setup_hint = 'POST normalized events to /api/events from your integration.'
    watch_paths: List[Path] = []

    def parse_all(self, db: Session) -> List[Event]:
        return []

    def parse_file(self, file_path: Path, db: Session) -> Optional[Event]:
        return None


class PlannedConnector(BaseCollector):
    """Product-facing placeholder for integrations that need provider-specific work."""

    status = 'planned'
    watch_paths: List[Path] = []

    def parse_all(self, db: Session) -> List[Event]:
        return []

    def parse_file(self, file_path: Path, db: Session) -> Optional[Event]:
        return None


class VSCodeExtensionConnector(PlannedConnector):
    tool_name = 'vscode_extension'
    display_name = 'VS Code AI Extensions'
    description = 'Connector target for Claude/Copilot/Cline/Roo-style VS Code chat and agent extensions.'
    setup_hint = 'Build or install a VS Code extension that posts chat/task events to /api/events.'


class GitHubCopilotConnector(PlannedConnector):
    tool_name = 'github_copilot'
    display_name = 'GitHub Copilot'
    description = 'Connector target for Copilot CLI, IDE chat, and GitHub-native assisted coding activity.'
    setup_hint = 'Use a CLI wrapper, VS Code extension bridge, or GitHub API integration to emit normalized events.'


class JulesConnector(PlannedConnector):
    tool_name = 'google_jules'
    display_name = 'Google Jules'
    description = 'Connector target for async Jules coding tasks and related Git/GitHub artifacts.'
    setup_hint = 'Use provider APIs, exported logs, or GitHub activity correlation to emit normalized events.'
