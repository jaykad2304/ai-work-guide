"""
Payment Settlement Reconciliation Dashboard

Interactive Streamlit dashboard for analyzing payment settlement data.
Uses Claude's reasoning for anomaly detection and reconciliation insights.

Run with: streamlit run app.py
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from sample_data import generate_settlement_data, inject_anomalies
from settlement_analyzer import SettlementAnalyzer
from datetime import datetime

# Page configuration
st.set_page_config(
    page_title="Payment Settlement Dashboard",
    page_icon="💳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Title and intro
st.title("💳 Payment Settlement Reconciliation Dashboard")
st.markdown("""
**AI-Powered Settlement Analysis** | Real-time anomaly detection & reconciliation insights

This dashboard demonstrates how Claude AI analyzes payment settlement data across 300+ payment methods
and 70+ countries for operational efficiency and risk management.
""")

# Sidebar controls
with st.sidebar:
    st.header("⚙️ Configuration")
    days_back = st.slider("Days of history to analyze", 3, 30, 7)
    auto_refresh = st.checkbox("Auto-refresh data", False)

    st.divider()
    st.subheader("📋 About This Demo")
    st.info(
        """
        **Data Privacy Note**: This demo uses synthetic payment settlement data.

        In production:
        - Data stays on your infrastructure
        - Claude API calls use encryption
        - No data stored on Anthropic servers
        - Compliant with PSD2, AML, and local regulations

        **Architecture**: Settlement Data → Claude Analysis → Reconciliation Insights
        """
    )

# Generate settlement data
@st.cache_data
def load_data(days):
    return generate_settlement_data(days_back=days)

@st.cache_data
def analyze_data(days):
    df = load_data(days)
    analyzer = SettlementAnalyzer(df, use_mock=True)
    results = analyzer.analyze_settlement_data()
    return df, results

# Load and analyze
with st.spinner("Loading settlement data..."):
    df, analysis = analyze_data(days_back)

# Key metrics
st.subheader("📊 Settlement Overview")
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.metric("Total Transactions", f"{analysis['summary']['total_transactions']:,}")

with col2:
    st.metric("Settlement Value", f"${analysis['summary']['total_value']:,.0f}")

with col3:
    st.metric("Payment Methods", analysis['summary']['settlement_methods'])

with col4:
    st.metric("Countries", analysis['summary']['countries'])

with col5:
    anomaly_count = len(analysis['anomalies_detected'])
    st.metric("Anomalies Detected", anomaly_count, delta="Alert!" if anomaly_count > 0 else "Healthy")

# Claude's Analysis Section
st.divider()
st.subheader("🤖 Claude's Analysis & Reasoning")

col_reasoning, col_recommendations = st.columns([2, 1])

with col_reasoning:
    st.write("**How Claude Analyzes This Data:**")
    st.write(analysis['claude_reasoning'])

with col_recommendations:
    st.write("**Recommended Actions:**")
    for i, rec in enumerate(analysis['recommendations'][:3], 1):
        priority_color = "🔴" if rec['priority'] == "immediate" else "🟡"
        st.markdown(f"{priority_color} **{rec['action']}**")
        st.caption(rec['details'])

# Anomalies section
if analysis['anomalies_detected']:
    st.divider()
    st.subheader("⚠️ Detected Anomalies")

    for anomaly in analysis['anomalies_detected']:
        col_left, col_right = st.columns([3, 1])

        with col_left:
            severity_color = "🔴" if anomaly['severity'] == 'high' else "🟡"
            st.markdown(f"#### {severity_color} {anomaly['message']}")
            st.write(f"**Recommendation:** {anomaly['recommendation']}")

        with col_right:
            st.metric("Severity", anomaly['severity'].upper())

# Daily metrics visualization
st.divider()
st.subheader("📈 Daily Settlement Trends")

daily_df = pd.DataFrame(analysis['daily_metrics'])
daily_df['date'] = pd.to_datetime(daily_df['date'])

fig = go.Figure()

fig.add_trace(go.Scatter(
    x=daily_df['date'],
    y=daily_df['success_rate'],
    name='Success Rate (%)',
    yaxis='y1',
    line=dict(color='#1f77b4', width=2),
    marker=dict(size=8),
))

fig.add_trace(go.Bar(
    x=daily_df['date'],
    y=daily_df['transaction_count'],
    name='Transaction Count',
    yaxis='y2',
    opacity=0.6,
    marker=dict(color='#2ca02c'),
))

fig.update_layout(
    title="Success Rate & Transaction Volume Over Time",
    xaxis=dict(title="Date"),
    yaxis=dict(
        title="Success Rate (%)",
        titlefont=dict(color='#1f77b4'),
        tickfont=dict(color='#1f77b4'),
    ),
    yaxis2=dict(
        title="Transaction Count",
        titlefont=dict(color='#2ca02c'),
        tickfont=dict(color='#2ca02c'),
        overlaying='y',
        side='right',
    ),
    hovermode='x unified',
    height=400,
)

st.plotly_chart(fig, use_container_width=True)

# Payment method breakdown
st.divider()
st.subheader("💱 Payment Method Performance")

method_df = pd.DataFrame(analysis['method_metrics'])

col_chart, col_table = st.columns([2, 1])

with col_chart:
    fig_methods = px.bar(
        method_df,
        x='method',
        y='transaction_count',
        color='success_rate',
        title="Transactions by Method & Success Rate",
        labels={'transaction_count': 'Transaction Count', 'method': 'Payment Method'},
        color_continuous_scale='RdYlGn',
        range_color=[90, 100],
    )
    fig_methods.update_layout(height=400)
    st.plotly_chart(fig_methods, use_container_width=True)

with col_table:
    st.write("**Top Performers:**")
    top_methods = method_df.nlargest(5, 'transaction_count')[['method', 'success_rate', 'transaction_count']]
    st.dataframe(top_methods, hide_index=True)

# Raw data explorer
st.divider()
st.subheader("🔍 Settlement Data Explorer")

with st.expander("View raw settlement transactions"):
    # Filter options
    col_filter1, col_filter2 = st.columns(2)

    with col_filter1:
        selected_method = st.multiselect(
            "Filter by payment method",
            options=df['payment_method'].unique(),
            default=df['payment_method'].unique()[:3]
        )

    with col_filter2:
        selected_status = st.multiselect(
            "Filter by status",
            options=df['status'].unique(),
            default=['settled']
        )

    # Apply filters
    filtered_df = df[
        (df['payment_method'].isin(selected_method)) &
        (df['status'].isin(selected_status))
    ].copy()

    filtered_df['timestamp'] = filtered_df['timestamp'].astype(str)
    st.dataframe(filtered_df, use_container_width=True, height=400)
    st.caption(f"Showing {len(filtered_df)} of {len(df)} transactions")

# Footer with architecture info
st.divider()
st.markdown("""
---
### 🏗️ Architecture

**Data Flow:**
1. **Settlement Transactions** → Multiple payment methods and countries
2. **Claude Analysis** → Pattern recognition, anomaly detection, reconciliation logic
3. **Insights Generation** → Actionable recommendations and alerts
4. **Dashboard Display** → Real-time monitoring for ops and engineering teams

**Security**: Data stays on-prem or uses secure API endpoints with encryption. No data stored on external servers.

*Built with Streamlit + Claude API + Pandas*
""")
