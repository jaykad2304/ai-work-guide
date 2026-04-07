"""
Data fetcher — pulls stock data from Yahoo Finance and NSE India.
"""

import yfinance as yf
import pandas as pd
import requests
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import config


def get_yf_symbol(symbol: str) -> str:
    """Append .NS suffix if not already present."""
    return symbol if symbol.endswith(config.YF_SUFFIX) else symbol + config.YF_SUFFIX


def fetch_historical(symbol: str, period: str, interval: str) -> pd.DataFrame:
    """
    Fetch OHLCV data from Yahoo Finance.
    Returns a DataFrame with columns: Open, High, Low, Close, Volume
    """
    ticker = get_yf_symbol(symbol)
    try:
        df = yf.download(ticker, period=period, interval=interval,
                         progress=False, auto_adjust=True)
        if df.empty:
            print(f"[WARNING] No data returned for {symbol}")
            return pd.DataFrame()
        df.index = pd.to_datetime(df.index)
        # Flatten multi-level columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        return df
    except Exception as e:
        print(f"[ERROR] fetching {symbol}: {e}")
        return pd.DataFrame()


def fetch_intraday(symbol: str) -> pd.DataFrame:
    return fetch_historical(symbol, config.INTRADAY_PERIOD, config.INTRADAY_INTERVAL)


def fetch_swing(symbol: str) -> pd.DataFrame:
    return fetch_historical(symbol, config.SWING_PERIOD, config.SWING_INTERVAL)


def fetch_longterm(symbol: str) -> pd.DataFrame:
    return fetch_historical(symbol, config.LONGTERM_PERIOD, config.LONGTERM_INTERVAL)


def fetch_nse_top_gainers() -> list[dict]:
    """
    Fetch top gainers from NSE India public API.
    Returns list of dicts with symbol, last price, change%.
    """
    url = "https://www.nseindia.com/api/live-analysis-variations?index=gainers"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.nseindia.com",
    }
    try:
        session = requests.Session()
        # NSE requires a session cookie — hit homepage first
        session.get("https://www.nseindia.com", headers=headers, timeout=10)
        resp = session.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        gainers = data.get("NIFTY", {}).get("data", [])
        return [
            {
                "symbol": g.get("symbol"),
                "last_price": g.get("ltp"),
                "change_pct": g.get("per"),
            }
            for g in gainers
        ]
    except Exception as e:
        print(f"[WARNING] NSE top gainers fetch failed: {e}")
        return []


def fetch_nse_top_losers() -> list[dict]:
    """Fetch top losers from NSE India."""
    url = "https://www.nseindia.com/api/live-analysis-variations?index=loosers"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.nseindia.com",
    }
    try:
        session = requests.Session()
        session.get("https://www.nseindia.com", headers=headers, timeout=10)
        resp = session.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        losers = data.get("NIFTY", {}).get("data", [])
        return [
            {
                "symbol": g.get("symbol"),
                "last_price": g.get("ltp"),
                "change_pct": g.get("per"),
            }
            for g in losers
        ]
    except Exception as e:
        print(f"[WARNING] NSE top losers fetch failed: {e}")
        return []


def fetch_nifty500_symbols() -> list[str]:
    """
    Fetch the live NIFTY 500 stock list from NSE India.
    Falls back to WATCHLIST if the request fails.
    """
    url = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.nseindia.com",
    }
    try:
        session = requests.Session()
        session.get("https://www.nseindia.com", headers=headers, timeout=10)
        resp = session.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        symbols = [item["symbol"] for item in data.get("data", []) if item.get("symbol")]
        # Remove index entry itself (e.g. "NIFTY 500")
        symbols = [s for s in symbols if " " not in s]
        if symbols:
            print(f"[INFO] Loaded {len(symbols)} stocks from NIFTY 500")
            return symbols
    except Exception as e:
        print(f"[WARNING] Could not fetch NIFTY 500 list: {e}")
    print("[INFO] Falling back to config WATCHLIST")
    return config.WATCHLIST


def get_stock_universe(mode: str = "watchlist") -> list[str]:
    """
    Return the list of symbols to scan.
    mode: 'watchlist' (20 stocks) | 'nifty500' (all 500)
    """
    if mode == "nifty500":
        return fetch_nifty500_symbols()
    return config.WATCHLIST


def fetch_all_watchlist(mode: str = "swing", universe: str = "watchlist") -> dict[str, pd.DataFrame]:
    """
    Fetch data for all symbols in the chosen universe.
    mode:     'intraday' | 'swing' | 'longterm'
    universe: 'watchlist' (20 stocks) | 'nifty500' (all 500)
    Returns {symbol: DataFrame}
    """
    fetchers = {
        "intraday": fetch_intraday,
        "swing": fetch_swing,
        "longterm": fetch_longterm,
    }
    fetch_fn = fetchers.get(mode, fetch_swing)
    symbols = get_stock_universe(universe)
    results = {}
    for symbol in symbols:
        df = fetch_fn(symbol)
        if not df.empty:
            results[symbol] = df
    return results
