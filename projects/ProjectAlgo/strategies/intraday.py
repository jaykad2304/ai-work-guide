"""
Intraday strategy — 5-minute candles, same-day trades.
Focuses on momentum, volume spikes, and tight ATR-based stops.
"""

import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from data.fetcher import fetch_intraday, get_stock_universe
from analysis.indicators import compute_all
from analysis.signals import generate_signal
import config


def run(symbols: list[str] = None, universe: str = "watchlist") -> list[dict]:
    """
    Run intraday analysis on all (or given) symbols.
    universe: 'watchlist' (20 stocks) | 'nifty500' (all 500)
    Returns list of signal dicts sorted by score descending.
    """
    symbols = symbols or get_stock_universe(universe)
    results = []

    for symbol in symbols:
        df = fetch_intraday(symbol)
        if df.empty:
            continue
        df = compute_all(df)
        signal = generate_signal(symbol, df, strategy="intraday")
        if signal and signal.get("action") in ("BUY", "SELL"):
            results.append(signal)

    results.sort(key=lambda x: x["score"], reverse=True)
    return results
