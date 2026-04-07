"""
Signal engine — reads indicator values from a processed DataFrame
and returns a structured signal dict with score, action, and reasons.
"""

import pandas as pd
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import config


def _latest(df: pd.DataFrame) -> pd.Series:
    return df.iloc[-1]


def _prev(df: pd.DataFrame) -> pd.Series:
    return df.iloc[-2] if len(df) >= 2 else df.iloc[-1]


def _bullish_score(row: pd.Series, prev: pd.Series, df: pd.DataFrame) -> tuple[float, list[str]]:
    """
    Core scoring logic shared across strategies.
    Returns (score 0-100, list of reason strings).
    """
    score = 0.0
    reasons = []

    # --- RSI (20 pts) ---
    rsi = row.get("RSI")
    if rsi is not None and not np.isnan(rsi):
        if rsi < config.RSI_OVERSOLD:
            score += 20
            reasons.append(f"RSI oversold ({rsi:.1f})")
        elif rsi < 45:
            score += 12
            reasons.append(f"RSI low ({rsi:.1f})")
        elif rsi > config.RSI_OVERBOUGHT:
            score -= 15
            reasons.append(f"RSI overbought ({rsi:.1f}) [bearish]")

    # --- MACD crossover (20 pts) ---
    macd = row.get("MACD")
    macd_sig = row.get("MACD_signal")
    prev_macd = prev.get("MACD")
    prev_sig = prev.get("MACD_signal")
    if all(v is not None and not np.isnan(v) for v in [macd, macd_sig, prev_macd, prev_sig]):
        bullish_cross = prev_macd < prev_sig and macd > macd_sig
        bearish_cross = prev_macd > prev_sig and macd < macd_sig
        if bullish_cross:
            score += 20
            reasons.append("MACD bullish crossover")
        elif bearish_cross:
            score -= 15
            reasons.append("MACD bearish crossover [bearish]")
        elif macd > macd_sig:
            score += 8
            reasons.append("MACD above signal")

    # --- Bollinger Band position (15 pts) ---
    bb_pct = row.get("BB_pct")
    if bb_pct is not None and not np.isnan(bb_pct):
        if bb_pct < 0.2:
            score += 15
            reasons.append(f"Near lower BB (BB%={bb_pct:.2f})")
        elif bb_pct > 0.8:
            score -= 10
            reasons.append(f"Near upper BB (BB%={bb_pct:.2f}) [caution]")
        elif 0.4 <= bb_pct <= 0.6:
            score += 5
            reasons.append("Mid-BB zone (neutral-bullish)")

    # --- EMA trend (15 pts) ---
    e9 = row.get(f"EMA_{config.EMA_SHORT}")
    e21 = row.get(f"EMA_{config.EMA_MEDIUM}")
    e50 = row.get(f"EMA_{config.EMA_LONG}")
    if all(v is not None and not np.isnan(v) for v in [e9, e21, e50]):
        if e9 > e21 > e50:
            score += 15
            reasons.append("Bullish EMA stack (9>21>50)")
        elif e9 < e21 < e50:
            score -= 10
            reasons.append("Bearish EMA stack [bearish]")
        elif e9 > e21:
            score += 7
            reasons.append("Short EMA above medium")

    # --- Price vs SMA200 (10 pts) ---
    sma200 = row.get(f"SMA_{config.SMA_200}")
    close = row.get("Close")
    if sma200 is not None and not np.isnan(sma200) and close is not None:
        if close > sma200:
            score += 10
            reasons.append("Price above SMA200 (long-term uptrend)")
        else:
            score -= 5
            reasons.append("Price below SMA200 [caution]")

    # --- Volume confirmation (10 pts) ---
    high_vol = row.get("High_volume")
    vol_ratio = row.get("Vol_ratio")
    if high_vol and vol_ratio is not None and not np.isnan(vol_ratio):
        score += 10
        reasons.append(f"High volume spike ({vol_ratio:.1f}x avg)")

    # --- Support proximity (10 pts) ---
    support = row.get("Support")
    if support is not None and close is not None and not np.isnan(support):
        dist_pct = (close - support) / support * 100
        if 0 <= dist_pct <= 2:
            score += 10
            reasons.append(f"Near support ({dist_pct:.1f}% above)")

    return max(0.0, min(100.0, score)), reasons


def generate_signal(symbol: str, df: pd.DataFrame, strategy: str) -> dict:
    """
    Generate a trading signal for a symbol.
    Returns a dict: {symbol, strategy, action, score, entry, target, stop_loss, reasons}
    """
    if df.empty or len(df) < 5:
        return {}

    row = _latest(df)
    prev = _prev(df)
    score, reasons = _bullish_score(row, prev, df)

    close = row.get("Close") or row.get("close")
    atr = row.get("ATR")

    # Determine action
    thresholds = {
        "intraday": config.INTRADAY_MIN_SCORE,
        "swing": config.SWING_MIN_SCORE,
        "longterm": config.LONGTERM_MIN_SCORE,
    }
    min_score = thresholds.get(strategy, 55)

    if score >= min_score:
        action = "BUY"
    elif score <= 30:
        action = "SELL"
    else:
        action = "HOLD"

    # Target and stop-loss using ATR
    target = stop_loss = None
    if close and atr and not np.isnan(atr):
        multipliers = {
            "intraday": (1.5, 1.0),
            "swing": (2.5, 1.5),
            "longterm": (4.0, 2.0),
        }
        t_mult, sl_mult = multipliers.get(strategy, (2.0, 1.5))
        target = round(close + atr * t_mult, 2)
        stop_loss = round(close - atr * sl_mult, 2)

    return {
        "symbol": symbol,
        "strategy": strategy,
        "action": action,
        "score": round(score, 2),
        "entry_price": round(float(close), 2) if close else None,
        "target": target,
        "stop_loss": stop_loss,
        "reasons": reasons,
    }
