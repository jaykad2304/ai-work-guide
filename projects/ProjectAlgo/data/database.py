"""
SQLite database layer.
Tables:
  - signals       : every signal generated (symbol, type, score, date)
  - outcomes      : actual price outcome after the signal period
  - model_scores  : historical accuracy metrics per strategy
"""

import sqlite3
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import config


def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS signals (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT NOT NULL,
            symbol      TEXT NOT NULL,
            strategy    TEXT NOT NULL,        -- 'intraday' | 'swing' | 'longterm'
            action      TEXT NOT NULL,        -- 'BUY' | 'SELL' | 'HOLD'
            score       REAL NOT NULL,
            entry_price REAL,
            target      REAL,
            stop_loss   REAL,
            reasons     TEXT,                 -- JSON list of reason strings
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS outcomes (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id     INTEGER REFERENCES signals(id),
            symbol        TEXT NOT NULL,
            strategy      TEXT NOT NULL,
            entry_price   REAL,
            exit_price    REAL,
            actual_return REAL,               -- % return
            hit_target    INTEGER,            -- 1=yes, 0=no
            hit_stoploss  INTEGER,            -- 1=yes, 0=no
            outcome_date  TEXT,
            created_at    TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS model_scores (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            strategy        TEXT NOT NULL,
            accuracy        REAL,
            avg_return      REAL,
            total_signals   INTEGER,
            winning_signals INTEGER,
            evaluated_at    TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()


def save_signal(symbol: str, strategy: str, action: str, score: float,
                entry_price: float = None, target: float = None,
                stop_loss: float = None, reasons: str = None) -> int:
    """Insert a new signal and return its id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO signals (date, symbol, strategy, action, score,
                             entry_price, target, stop_loss, reasons)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (datetime.now().strftime("%Y-%m-%d"), symbol, strategy, action,
          score, entry_price, target, stop_loss, reasons))
    conn.commit()
    signal_id = cursor.lastrowid
    conn.close()
    return signal_id


def save_outcome(signal_id: int, symbol: str, strategy: str,
                 entry_price: float, exit_price: float,
                 hit_target: bool = False, hit_stoploss: bool = False,
                 outcome_date: str = None):
    """Record what actually happened after a signal."""
    actual_return = ((exit_price - entry_price) / entry_price * 100
                     if entry_price and exit_price else None)
    conn = get_connection()
    conn.execute("""
        INSERT INTO outcomes (signal_id, symbol, strategy, entry_price,
                              exit_price, actual_return, hit_target,
                              hit_stoploss, outcome_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (signal_id, symbol, strategy, entry_price, exit_price,
          actual_return, int(hit_target), int(hit_stoploss),
          outcome_date or datetime.now().strftime("%Y-%m-%d")))
    conn.commit()
    conn.close()


def get_pending_outcomes(strategy: str = None) -> list[dict]:
    """Signals that don't yet have an outcome recorded."""
    conn = get_connection()
    query = """
        SELECT s.* FROM signals s
        LEFT JOIN outcomes o ON o.signal_id = s.id
        WHERE o.id IS NULL AND s.action = 'BUY'
    """
    params = []
    if strategy:
        query += " AND s.strategy = ?"
        params.append(strategy)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_strategy_accuracy(strategy: str) -> dict:
    """Compute win rate and avg return for a strategy from past outcomes."""
    conn = get_connection()
    row = conn.execute("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN actual_return > 0 THEN 1 ELSE 0 END) AS wins,
            AVG(actual_return) AS avg_return
        FROM outcomes
        WHERE strategy = ?
    """, (strategy,)).fetchone()
    conn.close()
    total = row["total"] or 0
    wins = row["wins"] or 0
    return {
        "strategy": strategy,
        "total_signals": total,
        "winning_signals": wins,
        "accuracy": round(wins / total * 100, 2) if total > 0 else 0,
        "avg_return": round(row["avg_return"] or 0, 2),
    }


def get_recent_signals(days: int = 7) -> list[dict]:
    """Fetch signals from the last N days."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM signals
        WHERE date >= date('now', ?)
        ORDER BY date DESC, score DESC
    """, (f"-{days} days",)).fetchall()
    conn.close()
    return [dict(r) for r in rows]
