# ProjectAlgo

An NSE algorithmic trading bot that generates intraday, swing, and long-term signals across NIFTY 500 stocks — with a self-improving feedback loop that auto-tunes strategy thresholds over time.

## Features

- **3 strategy modes** — intraday (5-min candles), swing (multi-day), long-term (monthly)
- **Full NIFTY 500 support** — run on a 20-stock watchlist or the full 500
- **Feedback loop** — records real trade outcomes and adjusts score thresholds automatically
- **Accuracy stats** — track how each strategy has performed historically
- **Scheduler** — runs daily at 9:20 AM (market open + 20 min) via `--schedule`
- **Rich terminal UI** — color-coded signals, scores, and reports

## Stack

- **Python** — `pandas`, `numpy`, `rich`, `schedule`
- **SQLite** — stores signals, outcomes, and learned thresholds
- **NSE data** — fetched via `data/fetcher.py`

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
python main.py                  # all strategies, 20-stock watchlist
python main.py --full           # all strategies, NIFTY 500
python main.py --intraday       # intraday signals only
python main.py --swing          # swing signals only
python main.py --longterm       # long-term signals only
python main.py --feedback       # record outcomes + auto-tune thresholds
python main.py --stats          # show strategy accuracy stats
python main.py --schedule       # run daily at 9:20 AM
```

## How the Feedback Loop Works

1. Signals are stored in SQLite with a timestamp
2. After the outcome window passes (1 day for intraday, 4 for swing, 30 for long-term), the bot fetches actual closing prices
3. Each signal is marked profitable or not
4. `adjust_thresholds()` recalculates score cutoffs based on historical accuracy
5. Future signals are filtered by the updated thresholds

Over time, only the signals that have historically led to profitable trades get surfaced.

## Project Structure

```
ProjectAlgo/
├── main.py               # Entry point + CLI
├── config.py             # Thresholds, watchlist, settings
├── data/
│   ├── fetcher.py        # NSE data fetching
│   └── database.py       # SQLite schema + queries
├── analysis/
│   ├── indicators.py     # Technical indicators (RSI, MACD, ATR, etc.)
│   └── signals.py        # Signal generation logic
├── strategies/
│   ├── intraday.py
│   ├── swing.py
│   └── longterm.py
├── training/
│   └── feedback.py       # Outcome recording + threshold tuning
├── reports/
│   └── generator.py      # Terminal + JSON report output
└── ui/
    └── app.py            # Rich UI components
```
