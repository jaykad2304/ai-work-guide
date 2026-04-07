"""
Feedback & training loop.

Workflow:
1. After a signal period ends, call record_outcome() to log what actually happened.
2. Call evaluate_strategy() to compute current accuracy.
3. Call adjust_thresholds() to auto-tune score thresholds based on past performance.

Over time, as outcomes accumulate in the DB, the model learns which
signals actually led to profitable trades.
"""

import sys
import os
import json
import numpy as np
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from data.database import (
    get_pending_outcomes, save_outcome, get_strategy_accuracy,
    get_connection, init_db
)
from data.fetcher import fetch_historical
import config


# How many days after signal to check the outcome
OUTCOME_WINDOWS = {
    "intraday": 1,
    "swing": 4,
    "longterm": 30,
}


def auto_record_outcomes():
    """
    For all pending signals whose outcome window has passed,
    fetch the actual closing price and record the outcome.
    Call this daily.
    """
    init_db()
    pending = get_pending_outcomes()

    for sig in pending:
        symbol = sig["symbol"]
        strategy = sig["strategy"]
        signal_date = datetime.strptime(sig["date"], "%Y-%m-%d")
        window_days = OUTCOME_WINDOWS.get(strategy, 4)
        outcome_due = signal_date + timedelta(days=window_days)

        if datetime.now() < outcome_due:
            continue  # Too early to record

        # Fetch daily data to get the exit price
        df = fetch_historical(symbol, period="1mo", interval="1d")
        if df.empty:
            continue

        # Find the closing price on or after outcome_due
        future = df[df.index >= outcome_due]
        if future.empty:
            continue

        exit_price = float(future.iloc[0]["Close"])
        entry_price = sig.get("entry_price") or float(df.iloc[-1]["Close"])

        hit_target = (exit_price >= sig["target"]) if sig.get("target") else False
        hit_sl = (exit_price <= sig["stop_loss"]) if sig.get("stop_loss") else False

        save_outcome(
            signal_id=sig["id"],
            symbol=symbol,
            strategy=strategy,
            entry_price=entry_price,
            exit_price=exit_price,
            hit_target=hit_target,
            hit_stoploss=hit_sl,
            outcome_date=outcome_due.strftime("%Y-%m-%d"),
        )
        print(f"[OUTCOME] {symbol} {strategy}: entry={entry_price:.2f} "
              f"exit={exit_price:.2f} target_hit={hit_target}")


def evaluate_all_strategies() -> dict:
    """Return accuracy stats for all three strategies."""
    return {
        s: get_strategy_accuracy(s)
        for s in ["intraday", "swing", "longterm"]
    }


def adjust_thresholds():
    """
    Auto-tune score thresholds in config based on past accuracy.
    If a strategy accuracy < 40%, raise its min score by 5.
    If accuracy > 65%, lower it by 2 (be less restrictive).
    Writes updated thresholds to a local overrides file.
    """
    overrides_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "threshold_overrides.json"
    )

    try:
        with open(overrides_path) as f:
            overrides = json.load(f)
    except FileNotFoundError:
        overrides = {
            "INTRADAY_MIN_SCORE": config.INTRADAY_MIN_SCORE,
            "SWING_MIN_SCORE": config.SWING_MIN_SCORE,
            "LONGTERM_MIN_SCORE": config.LONGTERM_MIN_SCORE,
        }

    mapping = {
        "intraday": "INTRADAY_MIN_SCORE",
        "swing": "SWING_MIN_SCORE",
        "longterm": "LONGTERM_MIN_SCORE",
    }

    for strategy, key in mapping.items():
        stats = get_strategy_accuracy(strategy)
        if stats["total_signals"] < 10:
            continue  # Not enough data yet
        accuracy = stats["accuracy"]
        current = overrides[key]
        if accuracy < 40:
            overrides[key] = min(current + 5, 85)
            print(f"[TUNE] {strategy}: accuracy={accuracy}% → raising threshold to {overrides[key]}")
        elif accuracy > 65:
            overrides[key] = max(current - 2, 40)
            print(f"[TUNE] {strategy}: accuracy={accuracy}% → lowering threshold to {overrides[key]}")

    with open(overrides_path, "w") as f:
        json.dump(overrides, f, indent=2)

    return overrides


def get_effective_thresholds() -> dict:
    """
    Returns active score thresholds — from overrides file if it exists,
    otherwise from config defaults.
    """
    overrides_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "data", "threshold_overrides.json"
    )
    try:
        with open(overrides_path) as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "INTRADAY_MIN_SCORE": config.INTRADAY_MIN_SCORE,
            "SWING_MIN_SCORE": config.SWING_MIN_SCORE,
            "LONGTERM_MIN_SCORE": config.LONGTERM_MIN_SCORE,
        }
