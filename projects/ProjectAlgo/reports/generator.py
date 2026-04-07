"""
Report generator — prints a rich terminal report and saves a text file.
"""

import os
import json
import sys
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from data.database import save_signal, get_strategy_accuracy
import config

console = Console()


def _action_color(action: str) -> str:
    return {"BUY": "green", "SELL": "red", "HOLD": "yellow"}.get(action, "white")


def print_signals_table(signals: list[dict], title: str):
    if not signals:
        console.print(f"[dim]No signals for {title}[/dim]")
        return

    table = Table(title=title, box=box.ROUNDED, show_lines=True)
    table.add_column("Symbol", style="cyan bold", width=12)
    table.add_column("Action", width=7)
    table.add_column("Score", justify="right", width=7)
    table.add_column("Entry", justify="right", width=10)
    table.add_column("Target", justify="right", width=10)
    table.add_column("Stop Loss", justify="right", width=10)
    table.add_column("Key Reasons", width=50)

    for s in signals:
        action = s.get("action", "")
        color = _action_color(action)
        reasons = s.get("reasons", [])
        short_reasons = "; ".join(reasons[:3]) if reasons else "-"

        table.add_row(
            s.get("symbol", "-"),
            f"[{color}]{action}[/{color}]",
            f"{s.get('score', 0):.0f}",
            f"₹{s.get('entry_price', 0):.2f}" if s.get("entry_price") else "-",
            f"₹{s.get('target', 0):.2f}" if s.get("target") else "-",
            f"₹{s.get('stop_loss', 0):.2f}" if s.get("stop_loss") else "-",
            short_reasons,
        )

    console.print(table)


def print_accuracy_panel(stats: dict):
    lines = []
    for strategy, data in stats.items():
        acc = data.get("accuracy", 0)
        total = data.get("total_signals", 0)
        avg_ret = data.get("avg_return", 0)
        color = "green" if acc >= 55 else "yellow" if acc >= 40 else "red"
        lines.append(
            f"[bold]{strategy.upper():10s}[/bold]  "
            f"Accuracy: [{color}]{acc:.1f}%[/{color}]  "
            f"Signals: {total}  Avg Return: {avg_ret:+.2f}%"
        )
    content = "\n".join(lines) if lines else "[dim]No data yet[/dim]"
    console.print(Panel(content, title="Strategy Performance", border_style="blue"))


def save_to_file(intraday: list, swing: list, longterm: list, stats: dict):
    os.makedirs(config.REPORT_DIR, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    path = os.path.join(config.REPORT_DIR, f"report_{date_str}.json")

    report = {
        "generated_at": datetime.now().isoformat(),
        "intraday": intraday,
        "swing": swing,
        "longterm": longterm,
        "strategy_accuracy": stats,
    }
    with open(path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    console.print(f"\n[dim]Report saved → {path}[/dim]")
    return path


def persist_signals(signals: list[dict]):
    """Save signals to DB."""
    for s in signals:
        if s.get("action") in ("BUY", "SELL"):
            save_signal(
                symbol=s["symbol"],
                strategy=s["strategy"],
                action=s["action"],
                score=s["score"],
                entry_price=s.get("entry_price"),
                target=s.get("target"),
                stop_loss=s.get("stop_loss"),
                reasons=json.dumps(s.get("reasons", [])),
            )


def generate(intraday: list, swing: list, longterm: list):
    """Full report: print to console + save to file + persist to DB."""
    console.print(Panel(
        f"[bold yellow]NSE AlgoTrader — Daily Report[/bold yellow]\n"
        f"[dim]{datetime.now().strftime('%A, %d %B %Y  %H:%M')}[/dim]",
        border_style="yellow"
    ))

    print_signals_table(intraday, "Intraday Signals (Today)")
    print_signals_table(swing, "Swing Trade Signals (3-4 Days)")
    print_signals_table(longterm, "Long-Term Signals (Weeks/Months)")

    stats = {s: get_strategy_accuracy(s) for s in ["intraday", "swing", "longterm"]}
    print_accuracy_panel(stats)

    persist_signals(intraday + swing + longterm)
    return save_to_file(intraday, swing, longterm, stats)
