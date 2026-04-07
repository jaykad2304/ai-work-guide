"""
Central configuration for ProjectAlgo trading bot.
Edit WATCHLIST to track your preferred NSE stocks.
"""

# NSE stock symbols — append ".NS" suffix for Yahoo Finance
WATCHLIST = [
    "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
    "SBIN", "WIPRO", "BAJFINANCE", "AXISBANK", "HCLTECH",
    "TATAMOTORS", "MARUTI", "SUNPHARMA", "ONGC", "NTPC",
    "ADANIENT", "ADANIPORTS", "POWERGRID", "TECHM", "TITAN",
]

# Yahoo Finance requires ".NS" suffix for NSE stocks
YF_SUFFIX = ".NS"

# --- Technical indicator thresholds ---
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 70
RSI_PERIOD = 14

MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9

BB_PERIOD = 20
BB_STD = 2

EMA_SHORT = 9
EMA_MEDIUM = 21
EMA_LONG = 50
SMA_200 = 200

VOLUME_SPIKE_MULTIPLIER = 1.5   # flag if volume > 1.5x 20-day avg

# --- Signal scoring thresholds ---
# Each strategy returns a score 0–100; these are minimum to qualify
INTRADAY_MIN_SCORE = 60
SWING_MIN_SCORE = 55
LONGTERM_MIN_SCORE = 50

# --- Data fetch periods ---
INTRADAY_INTERVAL = "5m"
INTRADAY_PERIOD = "1d"

SWING_INTERVAL = "1d"
SWING_PERIOD = "3mo"

LONGTERM_INTERVAL = "1wk"
LONGTERM_PERIOD = "2y"

# --- Database ---
DB_PATH = "data/algo_trading.db"

# --- Report output ---
REPORT_DIR = "reports/output"
