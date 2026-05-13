#!/usr/bin/env bash
# AI Observability Shell Hooks
# Auto-starts backend + daemon when you launch any AI tool
# Add to ~/.bashrc or ~/.zshrc: source ~/Jay/ai-work-guide/projects/AIObservabilityPlatform/scripts/hooks.sh

AI_OBS_DIR="$HOME/Jay/ai-work-guide/projects/AIObservabilityPlatform"
BACKEND_LOG="/tmp/ai-observer-backend.log"
DAEMON_LOG="/tmp/ai-observer-daemon.log"

_ai_observer_start() {
    # Check if backend is already running
    if ! curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "[ai-observer] starting backend..."
        (cd "$AI_OBS_DIR" && source venv/bin/activate && \
         python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 \
         >> "$BACKEND_LOG" 2>&1 &)
        sleep 2
    fi

    # Check if daemon is already running
    if ! pgrep -f "python daemon.py" > /dev/null 2>&1; then
        echo "[ai-observer] starting file watcher daemon..."
        (cd "$AI_OBS_DIR" && source venv/bin/activate && \
         python daemon.py >> "$DAEMON_LOG" 2>&1 &)
        sleep 1
    fi
}

# Wrap AI CLI tools
claude() {
    _ai_observer_start
    command claude "$@"
}

codex() {
    _ai_observer_start
    command codex "$@"
}

# To add a new tool, add a function like:
# mytool() { _ai_observer_start; command mytool "$@"; }
