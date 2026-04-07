"""
Technical indicators computed on top of a raw OHLCV DataFrame.
All functions accept a DataFrame and return the same DataFrame
with new columns appended.
"""

import pandas as pd
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import config


def add_rsi(df: pd.DataFrame, period: int = None) -> pd.DataFrame:
    period = period or config.RSI_PERIOD
    delta = df["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss
    df["RSI"] = 100 - (100 / (1 + rs))
    return df


def add_macd(df: pd.DataFrame,
             fast: int = None, slow: int = None, signal: int = None) -> pd.DataFrame:
    fast = fast or config.MACD_FAST
    slow = slow or config.MACD_SLOW
    signal = signal or config.MACD_SIGNAL
    ema_fast = df["Close"].ewm(span=fast, adjust=False).mean()
    ema_slow = df["Close"].ewm(span=slow, adjust=False).mean()
    df["MACD"] = ema_fast - ema_slow
    df["MACD_signal"] = df["MACD"].ewm(span=signal, adjust=False).mean()
    df["MACD_hist"] = df["MACD"] - df["MACD_signal"]
    return df


def add_bollinger_bands(df: pd.DataFrame,
                        period: int = None, std: float = None) -> pd.DataFrame:
    period = period or config.BB_PERIOD
    std = std or config.BB_STD
    sma = df["Close"].rolling(period).mean()
    rolling_std = df["Close"].rolling(period).std()
    df["BB_mid"] = sma
    df["BB_upper"] = sma + std * rolling_std
    df["BB_lower"] = sma - std * rolling_std
    df["BB_pct"] = (df["Close"] - df["BB_lower"]) / (df["BB_upper"] - df["BB_lower"])
    return df


def add_ema(df: pd.DataFrame) -> pd.DataFrame:
    df[f"EMA_{config.EMA_SHORT}"] = df["Close"].ewm(
        span=config.EMA_SHORT, adjust=False).mean()
    df[f"EMA_{config.EMA_MEDIUM}"] = df["Close"].ewm(
        span=config.EMA_MEDIUM, adjust=False).mean()
    df[f"EMA_{config.EMA_LONG}"] = df["Close"].ewm(
        span=config.EMA_LONG, adjust=False).mean()
    return df


def add_sma200(df: pd.DataFrame) -> pd.DataFrame:
    if len(df) >= config.SMA_200:
        df[f"SMA_{config.SMA_200}"] = df["Close"].rolling(config.SMA_200).mean()
    else:
        df[f"SMA_{config.SMA_200}"] = np.nan
    return df


def add_volume_analysis(df: pd.DataFrame) -> pd.DataFrame:
    df["Vol_MA20"] = df["Volume"].rolling(20).mean()
    df["Vol_ratio"] = df["Volume"] / df["Vol_MA20"]
    df["High_volume"] = df["Vol_ratio"] > config.VOLUME_SPIKE_MULTIPLIER
    return df


def add_atr(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Average True Range — measures volatility."""
    high_low = df["High"] - df["Low"]
    high_close = (df["High"] - df["Close"].shift()).abs()
    low_close = (df["Low"] - df["Close"].shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df["ATR"] = tr.rolling(period).mean()
    return df


def add_support_resistance(df: pd.DataFrame, window: int = 20) -> pd.DataFrame:
    """Simple pivot-point based support and resistance."""
    df["Support"] = df["Low"].rolling(window).min()
    df["Resistance"] = df["High"].rolling(window).max()
    return df


def compute_all(df: pd.DataFrame) -> pd.DataFrame:
    """Apply all indicators in one call."""
    if df.empty or len(df) < 30:
        return df
    df = add_rsi(df)
    df = add_macd(df)
    df = add_bollinger_bands(df)
    df = add_ema(df)
    df = add_sma200(df)
    df = add_volume_analysis(df)
    df = add_atr(df)
    df = add_support_resistance(df)
    return df
