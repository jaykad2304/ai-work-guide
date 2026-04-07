"""
NSE AlgoTrader — Streamlit UI
Run with: streamlit run ui/app.py
"""

import streamlit as st
import pandas as pd
import sys
import os
import json
from datetime import datetime

# Make sure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from data.database import init_db, get_recent_signals, get_strategy_accuracy
from data.fetcher import fetch_swing, fetch_intraday, fetch_longterm, get_stock_universe
from analysis.indicators import compute_all
import config

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="NSE AlgoTrader",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

init_db()

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("📈 NSE AlgoTrader")
    st.caption(f"Today: {datetime.now().strftime('%d %b %Y  %H:%M')}")

    st.divider()

    universe = st.radio(
        "Stock Universe",
        options=["watchlist", "nifty500"],
        format_func=lambda x: "Watchlist (20 stocks)" if x == "watchlist" else "NIFTY 500 (all stocks)",
        index=0,
    )

    st.divider()

    st.markdown("**Run Analysis**")
    run_swing    = st.button("Run Swing Analysis",    use_container_width=True)
    run_intraday = st.button("Run Intraday Analysis", use_container_width=True)
    run_longterm = st.button("Run Long-Term Analysis",use_container_width=True)

    st.divider()
    st.caption("Intraday data is only meaningful\nduring market hours (9:15–3:30 IST).")


# ── Helper: run and cache analysis ───────────────────────────────────────────
@st.cache_data(ttl=900, show_spinner=False)   # cache 15 min
def _run_strategy(strategy_name: str, universe: str):
    if strategy_name == "swing":
        from strategies.swing import run
    elif strategy_name == "intraday":
        from strategies.intraday import run
    else:
        from strategies.longterm import run
    return run(universe=universe)


def signals_to_df(signals: list[dict]) -> pd.DataFrame:
    if not signals:
        return pd.DataFrame()
    rows = []
    for s in signals:
        rows.append({
            "Symbol":     s.get("symbol", "-"),
            "Action":     s.get("action", "-"),
            "Score":      s.get("score", 0),
            "Entry ₹":    s.get("entry_price"),
            "Target ₹":   s.get("target"),
            "Stop Loss ₹":s.get("stop_loss"),
            "Reasons":    "; ".join(s.get("reasons", [])[:3]),
        })
    return pd.DataFrame(rows)


def style_action(val):
    colors = {"BUY": "#1a7a1a", "SELL": "#b30000", "HOLD": "#996600"}
    bg     = {"BUY": "#d4edda", "SELL": "#f8d7da", "HOLD": "#fff3cd"}
    c = colors.get(val, "black")
    b = bg.get(val, "white")
    return f"color: {c}; background-color: {b}; font-weight: bold"


def render_signals(signals: list[dict], label: str):
    st.subheader(label)
    if not signals:
        st.info("No signals generated. Market may be closed or no stocks crossed the threshold.")
        return

    df = signals_to_df(signals)
    styled = df.style.map(style_action, subset=["Action"])
    st.dataframe(styled, use_container_width=True, hide_index=True)

    buy_count  = sum(1 for s in signals if s["action"] == "BUY")
    sell_count = sum(1 for s in signals if s["action"] == "SELL")
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Signals", len(signals))
    col2.metric("BUY",  buy_count,  delta=None)
    col3.metric("SELL", sell_count, delta=None)


# ── Tabs ──────────────────────────────────────────────────────────────────────
tab_swing, tab_intraday, tab_longterm, tab_chart, tab_history, tab_performance = st.tabs([
    "Swing (3-4 Days)",
    "Intraday",
    "Long-Term",
    "Stock Chart",
    "Signal History",
    "Performance",
])

# ── Swing tab ─────────────────────────────────────────────────────────────────
with tab_swing:
    if run_swing:
        with st.spinner("Running swing analysis..."):
            st.session_state["swing_signals"] = _run_strategy("swing", universe)
            _run_strategy.clear()  # clear cache so next run is fresh

    signals = st.session_state.get("swing_signals", [])
    render_signals(signals, "Swing Trade Signals")

    if not signals:
        st.caption("Click **Run Swing Analysis** in the sidebar to generate signals.")

# ── Intraday tab ──────────────────────────────────────────────────────────────
with tab_intraday:
    st.warning("Intraday signals are only meaningful during NSE market hours: **9:15 AM – 3:30 PM IST**")

    if run_intraday:
        with st.spinner("Running intraday analysis..."):
            st.session_state["intraday_signals"] = _run_strategy("intraday", universe)
            _run_strategy.clear()

    signals = st.session_state.get("intraday_signals", [])
    render_signals(signals, "Intraday Signals")

    if not signals:
        st.caption("Click **Run Intraday Analysis** in the sidebar.")

# ── Long-Term tab ─────────────────────────────────────────────────────────────
with tab_longterm:
    if run_longterm:
        with st.spinner("Running long-term analysis..."):
            st.session_state["longterm_signals"] = _run_strategy("longterm", universe)
            _run_strategy.clear()

    signals = st.session_state.get("longterm_signals", [])
    render_signals(signals, "Long-Term Investment Signals")

    if not signals:
        st.caption("Click **Run Long-Term Analysis** in the sidebar.")

# ── Stock Chart tab ───────────────────────────────────────────────────────────
with tab_chart:
    st.subheader("Stock Price Chart")

    col1, col2 = st.columns([2, 1])
    with col1:
        symbol_input = st.text_input(
            "Enter NSE Symbol", value="RELIANCE",
            placeholder="e.g. TCS, INFY, SBIN"
        ).upper().strip()
    with col2:
        chart_period = st.selectbox(
            "Period",
            options=["swing", "longterm", "intraday"],
            format_func=lambda x: {"swing": "3 Months (Daily)", "longterm": "2 Years (Weekly)", "intraday": "Today (5-min)"}[x]
        )

    if st.button("Load Chart", use_container_width=False):
        with st.spinner(f"Fetching {symbol_input}..."):
            if chart_period == "swing":
                df = fetch_swing(symbol_input)
            elif chart_period == "intraday":
                df = fetch_intraday(symbol_input)
            else:
                df = fetch_longterm(symbol_input)

            if df.empty:
                st.error(f"No data found for {symbol_input}. Check the symbol.")
            else:
                df = compute_all(df)

                # Price + EMA chart
                st.markdown(f"**{symbol_input}** — Close Price & EMAs")
                chart_data = df[["Close"]].copy()
                ema_cols = [f"EMA_{config.EMA_SHORT}", f"EMA_{config.EMA_MEDIUM}", f"EMA_{config.EMA_LONG}"]
                for col in ema_cols:
                    if col in df.columns:
                        chart_data[col] = df[col]
                st.line_chart(chart_data)

                # Volume
                st.markdown("**Volume**")
                st.bar_chart(df["Volume"])

                # Indicators snapshot
                latest = df.iloc[-1]
                st.markdown("**Latest Indicator Values**")
                ind_cols = st.columns(4)
                ind_cols[0].metric("RSI",  f"{latest.get('RSI', float('nan')):.1f}" if pd.notna(latest.get('RSI')) else "N/A")
                ind_cols[1].metric("MACD", f"{latest.get('MACD', float('nan')):.2f}" if pd.notna(latest.get('MACD')) else "N/A")
                ind_cols[2].metric("BB %", f"{latest.get('BB_pct', float('nan')):.2f}" if pd.notna(latest.get('BB_pct')) else "N/A")
                ind_cols[3].metric("ATR",  f"{latest.get('ATR', float('nan')):.2f}" if pd.notna(latest.get('ATR')) else "N/A")

# ── Signal History tab ────────────────────────────────────────────────────────
with tab_history:
    st.subheader("Signal History (Last 30 Days)")

    days_filter = st.slider("Show signals from last N days", 1, 30, 7)
    history = get_recent_signals(days=days_filter)

    if not history:
        st.info("No signals in the database yet. Run an analysis first.")
    else:
        rows = []
        for h in history:
            reasons = h.get("reasons", "[]")
            try:
                reasons_list = json.loads(reasons) if reasons else []
            except Exception:
                reasons_list = []
            rows.append({
                "Date":       h["date"],
                "Symbol":     h["symbol"],
                "Strategy":   h["strategy"].upper(),
                "Action":     h["action"],
                "Score":      h["score"],
                "Entry ₹":    h.get("entry_price"),
                "Target ₹":   h.get("target"),
                "Stop Loss ₹":h.get("stop_loss"),
                "Reasons":    "; ".join(reasons_list[:2]),
            })
        df_hist = pd.DataFrame(rows)
        styled = df_hist.style.map(style_action, subset=["Action"])
        st.dataframe(styled, use_container_width=True, hide_index=True)
        st.caption(f"{len(rows)} signals found.")

# ── Performance tab ───────────────────────────────────────────────────────────
with tab_performance:
    st.subheader("Strategy Performance")
    st.caption("Accuracy improves as you record more outcomes via `python main.py --feedback`")

    strategies = ["intraday", "swing", "longterm"]
    cols = st.columns(3)

    for i, strategy in enumerate(strategies):
        stats = get_strategy_accuracy(strategy)
        with cols[i]:
            st.markdown(f"**{strategy.upper()}**")
            acc = stats["accuracy"]
            color = "normal" if acc >= 55 else "inverse" if acc < 40 else "off"
            st.metric("Accuracy",       f"{acc:.1f}%",          delta=None)
            st.metric("Total Signals",  stats["total_signals"],  delta=None)
            st.metric("Winning Trades", stats["winning_signals"],delta=None)
            st.metric("Avg Return",     f"{stats['avg_return']:+.2f}%", delta=None)

    st.divider()
    st.markdown("**How the feedback loop works:**")
    st.markdown("""
    1. Run the bot daily — signals are saved to the database automatically
    2. After the holding period ends (1 day for intraday, 4 days for swing, 30 days for long-term),
       run `python main.py --feedback` to record actual price outcomes
    3. The bot compares entry price vs exit price and adjusts scoring thresholds automatically
    4. The more data you feed in, the more accurate the signals become
    """)
