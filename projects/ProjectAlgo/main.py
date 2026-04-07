"""
ProjectAlgo — NSE Algorithmic Trading Bot
==========================================
Usage:
  python main.py                       → run all strategies, 20-stock watchlist
  python main.py --full                → run all strategies, full NIFTY 500
  python main.py --quick               → run all strategies, 20-stock watchlist (explicit)
  python main.py --intraday            → intraday signals only (watchlist)
  python main.py --intraday --full     → intraday signals, NIFTY 500
  python main.py --swing               → swing signals only (watchlist)
  python main.py --swing --full        → swing signals, NIFTY 500
  python main.py --longterm            → long-term signals only (watchlist)
  python main.py --longterm --full     → long-term signals, NIFTY 500
  python main.py --feedback            → record past outcomes + auto-tune thresholds
  python main.py --stats               → show strategy accuracy stats
  python main.py --schedule            → run every day at 9:20 AM (market open + 20 min)
  python main.py --schedule --full     → scheduled run with NIFTY 500
"""

import argparse
import sys
import schedule
import time
from rich.console import Console

from data.database import init_db
from strategies import intraday as intraday_strategy
from strategies import swing as swing_strategy
from strategies import longterm as longterm_strategy
from reports.generator import generate
from training.feedback import auto_record_outcomes, evaluate_all_strategies, adjust_thresholds

console = Console()


def run_all(universe: str = "watchlist"):
    label = "NIFTY 500" if universe == "nifty500" else "Watchlist (20 stocks)"
    console.print(f"\n[bold cyan]Universe: {label}[/bold cyan]")

    console.print("[bold cyan]Fetching intraday data...[/bold cyan]")
    intra = intraday_strategy.run(universe=universe)

    console.print("[bold cyan]Fetching swing data...[/bold cyan]")
    sw = swing_strategy.run(universe=universe)

    console.print("[bold cyan]Fetching long-term data...[/bold cyan]")
    lt = longterm_strategy.run(universe=universe)

    generate(intra, sw, lt)


def run_feedback():
    console.print("[bold magenta]Recording past outcomes...[/bold magenta]")
    auto_record_outcomes()

    console.print("[bold magenta]Adjusting thresholds...[/bold magenta]")
    new_thresholds = adjust_thresholds()
    console.print(f"[dim]Active thresholds: {new_thresholds}[/dim]")


def run_stats():
    stats = evaluate_all_strategies()
    for strategy, data in stats.items():
        console.print(
            f"[bold]{strategy.upper()}[/bold]  "
            f"Accuracy={data['accuracy']:.1f}%  "
            f"Total={data['total_signals']}  "
            f"AvgReturn={data['avg_return']:+.2f}%"
        )


def scheduled_job(universe: str = "watchlist"):
    console.print("\n[bold yellow]Scheduled run triggered...[/bold yellow]")
    run_feedback()
    run_all(universe=universe)


def main():
    parser = argparse.ArgumentParser(description="NSE AlgoTrader")
    parser.add_argument("--intraday", action="store_true", help="Intraday signals only")
    parser.add_argument("--swing", action="store_true", help="Swing signals only")
    parser.add_argument("--longterm", action="store_true", help="Long-term signals only")
    parser.add_argument("--feedback", action="store_true", help="Record outcomes + tune thresholds")
    parser.add_argument("--stats", action="store_true", help="Show strategy accuracy stats")
    parser.add_argument("--schedule", action="store_true", help="Run daily at 9:20 AM")

    # Universe selection — mutually exclusive
    universe_group = parser.add_mutually_exclusive_group()
    universe_group.add_argument(
        "--quick", action="store_true",
        help="Use 20-stock watchlist (fast, default)"
    )
    universe_group.add_argument(
        "--full", action="store_true",
        help="Use full NIFTY 500 list (slower, more comprehensive)"
    )

    args = parser.parse_args()

    # Resolve universe
    universe = "nifty500" if args.full else "watchlist"

    # Always initialise DB
    init_db()

    if args.schedule:
        label = "NIFTY 500" if universe == "nifty500" else "Watchlist"
        console.print(f"[bold green]Scheduler started — daily at 09:20 | Universe: {label}[/bold green]")
        schedule.every().day.at("09:20").do(scheduled_job, universe=universe)
        while True:
            schedule.run_pending()
            time.sleep(30)
        return

    if args.feedback:
        run_feedback()
        return

    if args.stats:
        run_stats()
        return

    if args.intraday:
        signals = intraday_strategy.run(universe=universe)
        from reports.generator import print_signals_table
        print_signals_table(signals, f"Intraday Signals ({universe})")
        return

    if args.swing:
        signals = swing_strategy.run(universe=universe)
        from reports.generator import print_signals_table
        print_signals_table(signals, f"Swing Signals ({universe})")
        return

    if args.longterm:
        signals = longterm_strategy.run(universe=universe)
        from reports.generator import print_signals_table
        print_signals_table(signals, f"Long-Term Signals ({universe})")
        return

    # Default: run everything
    run_all(universe=universe)


if __name__ == "__main__":
    main()
