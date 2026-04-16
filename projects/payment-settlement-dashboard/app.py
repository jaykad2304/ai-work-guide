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

# Cost Calculator Section
st.divider()
st.subheader("💰 Settlement Cost Analysis")

costs = analysis['costs']
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.metric("Gross Settled", f"${costs['settled_amount']:,.0f}")

with col2:
    st.metric("Merchant Fees", f"${costs['merchant_fees']:,.0f}", delta=f"{costs['merchant_fees']/costs['settled_amount']*100:.1f}%")

with col3:
    st.metric("Chargeback Fees", f"${costs['chargeback_costs']:,.0f}", delta=str(int(costs['chargeback_costs']/25)) + " CBs" if costs['chargeback_costs'] > 0 else "Healthy")

with col4:
    st.metric("Other Costs", f"${costs['reversal_costs'] + costs['failed_transaction_losses']:,.0f}")

with col5:
    st.metric("Net Revenue", f"${costs['net_revenue']:,.0f}", delta=f"{costs['cost_ratio']:.1f}% costs")

# Cost breakdown chart
col_chart, col_breakdown = st.columns([2, 1])

with col_chart:
    costs_data = {
        'Merchant Fees': costs['merchant_fees'],
        'Chargeback Costs': costs['chargeback_costs'],
        'Reversal Costs': costs['reversal_costs'],
        'Failed Transactions': costs['failed_transaction_losses'],
    }
    costs_df = pd.DataFrame(list(costs_data.items()), columns=['Cost Type', 'Amount'])

    fig_costs = px.pie(
        costs_df,
        values='Amount',
        names='Cost Type',
        title='Cost Breakdown',
        color_discrete_sequence=['#ff6b6b', '#ee5a6f', '#f06f6f', '#ff8c8c']
    )
    st.plotly_chart(fig_costs, use_container_width=True)

with col_breakdown:
    st.write("**Cost Summary:**")
    st.markdown(f"**Gross:** ${costs['settled_amount']:,.0f}")
    st.markdown(f"**Total Costs:** ${costs['total_costs']:,.0f}")
    st.markdown(f"**Net:** ${costs['net_revenue']:,.0f}")

    savings = (costs['chargeback_costs'] + costs['reversal_costs']) * 0.3
    st.info(f"💡 Early anomaly detection could save ~${savings:,.0f}")

# Chargeback Investigation
st.divider()
st.subheader("🔍 Automated Chargeback Investigation")

chargeback_data = analysis['chargeback_analysis']

if chargeback_data['total_chargebacks'] > 0:
    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Total Chargebacks", chargeback_data['total_chargebacks'])

    with col2:
        st.metric(
            "Chargeback Value",
            f"${chargeback_data['total_chargeback_value']:,.0f}",
            delta=f"Avg: ${chargeback_data['patterns']['average_chargeback']:,.0f}"
        )

    with col3:
        high_risk_count = len(chargeback_data['patterns']['high_risk_methods'])
        st.metric(
            "High-Risk Methods",
            high_risk_count,
            delta=f"{', '.join(chargeback_data['patterns']['high_risk_methods'][:2])}" if high_risk_count > 0 else "None"
        )

    # Claude's Investigation
    st.write("**Claude's Investigation Report:**")
    st.text(chargeback_data['claude_investigation'])

    # Recommended Auto-Actions
    if chargeback_data['recommendations']:
        st.write("**Automated Actions Claude Recommends:**")
        for i, rec in enumerate(chargeback_data['recommendations'], 1):
            severity_icon = "🔴" if rec['severity'] == 'high' else "🟡"
            with st.expander(f"{severity_icon} {i}. {rec['action']}"):
                st.write(f"**Reason:** {rec['reason']}")
                st.write(f"**Severity:** {rec['severity'].upper()}")
                st.info(f"**Auto-Remediation:** {rec['auto_remediation']}")

    # Chargeback Details Table
    st.write("**Individual Chargeback Details (Top 10):**")
    chargebacks_display = []
    for cb in chargeback_data['chargeback_details']:
        chargebacks_display.append({
            'Transaction ID': cb['transaction_id'],
            'Amount': f"${cb['amount']:,.0f}",
            'Method': cb['method'],
            'Country': cb['country'],
            'Assessment': cb['assessment'],
            'Recommended Action': cb['recommended_action'],
        })

    st.dataframe(pd.DataFrame(chargebacks_display), use_container_width=True)

else:
    st.success("✅ No chargebacks detected. Settlement is healthy!")

# Settlement Trends Visualization
st.divider()
st.subheader("📈 Settlement Trends")

tab1, tab2 = st.tabs(["⏰ Hourly (Real-Time)", "📅 Daily (Trends)"])

# Hourly view
with tab1:
    st.write("**Real-time hourly monitoring** — Detect anomalies as they form")

    hourly_df = pd.DataFrame(analysis['hourly_metrics'])
    hourly_df['timestamp'] = pd.to_datetime(hourly_df['timestamp'])

    fig_hourly = go.Figure()

    fig_hourly.add_trace(go.Scatter(
        x=hourly_df['timestamp'],
        y=hourly_df['success_rate'],
        name='Success Rate (%)',
        yaxis='y1',
        line=dict(color='#ff6b6b', width=2),
        marker=dict(size=6),
    ))

    fig_hourly.add_trace(go.Bar(
        x=hourly_df['timestamp'],
        y=hourly_df['transaction_count'],
        name='Transaction Count',
        yaxis='y2',
        opacity=0.6,
        marker=dict(color='#4ecdc4'),
    ))

    fig_hourly.update_layout(
        title="Hourly Success Rate & Transaction Volume",
        xaxis=dict(title="Time (Hourly)"),
        yaxis=dict(
            title="Success Rate (%)",
            titlefont=dict(color='#ff6b6b'),
            tickfont=dict(color='#ff6b6b'),
        ),
        yaxis2=dict(
            title="Transaction Count",
            titlefont=dict(color='#4ecdc4'),
            tickfont=dict(color='#4ecdc4'),
            overlaying='y',
            side='right',
        ),
        hovermode='x unified',
        height=400,
    )

    st.plotly_chart(fig_hourly, use_container_width=True)

    st.caption("💡 **Hourly view shows** when anomalies first appear (e.g., success rate drops in hour 3)")

# Daily view
with tab2:
    st.write("**Daily trends** — Understand patterns over days")

    daily_df = pd.DataFrame(analysis['daily_metrics'])
    daily_df['date'] = pd.to_datetime(daily_df['date'])

    fig_daily = go.Figure()

    fig_daily.add_trace(go.Scatter(
        x=daily_df['date'],
        y=daily_df['success_rate'],
        name='Success Rate (%)',
        yaxis='y1',
        line=dict(color='#1f77b4', width=2),
        marker=dict(size=8),
    ))

    fig_daily.add_trace(go.Bar(
        x=daily_df['date'],
        y=daily_df['transaction_count'],
        name='Transaction Count',
        yaxis='y2',
        opacity=0.6,
        marker=dict(color='#2ca02c'),
    ))

    fig_daily.update_layout(
        title="Daily Success Rate & Transaction Volume",
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

    st.plotly_chart(fig_daily, use_container_width=True)

    st.caption("💡 **Daily view shows** overall health and weekly patterns")

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

# KPI Dashboard
st.divider()
st.subheader("📊 KPI Dashboard")

kpis = analysis['kpis']
kpi_col1, kpi_col2, kpi_col3, kpi_col4 = st.columns(4)

with kpi_col1:
    st.metric(
        "Settlement Success Rate",
        f"{kpis['settlement_success_rate']}%",
        delta="Target: 99%"
    )

with kpi_col2:
    st.metric(
        "Reconciliation Accuracy",
        f"{kpis['reconciliation_accuracy']}%",
        delta="Disputes excluded"
    )

with kpi_col3:
    st.metric(
        "Settlement Timeliness",
        f"{kpis['settlement_timeliness']}%",
        delta="SLA compliance"
    )

with kpi_col4:
    st.metric(
        "Exception Rate",
        f"{kpis['exception_rate']}%",
        delta=f"{kpis['chargeback_count']} chargebacks"
    )

# Automation Opportunities
st.divider()
st.subheader("🚀 Automation & Transformation Opportunities")

st.write("**Identified processes that can be automated with Claude AI:**")

opportunities = analysis['automation_opportunities']
for i, opp in enumerate(opportunities, 1):
    with st.expander(f"**{i}. {opp['process']}** — {opp['priority']} Priority"):
        col1, col2 = st.columns(2)

        with col1:
            st.write("**Current State**")
            st.write(opp['current_state'])
            st.write(f"⏱️ Time spent: {opp['time_spent']}")

        with col2:
            st.write("**Proposed Automation**")
            st.write(opp['proposed_automation'])
            st.write(f"💰 Annual ROI: **{opp['annual_roi']}**")

        col3, col4 = st.columns(2)
        with col3:
            st.write("**Implementation**")
            st.write(opp['implementation'])
            st.write(f"Effort: {opp['implementation_effort']}")

        with col4:
            st.write("**Metrics**")
            st.write(f"Complexity: {opp['complexity']}")

# Cross-Functional Impact
st.divider()
st.subheader("🤝 Cross-Functional Impact")

st.write("**How this solution benefits each stakeholder team:**")

impact = analysis['cross_functional_impact']
impact_cols = st.columns(5)

teams = ['commercial', 'finance', 'tax', 'product', 'engineering']
impact_data = [impact[team] for team in teams]

for col, team_impact in zip(impact_cols, impact_data):
    with col:
        st.markdown(f"### {team_impact['team']}")
        st.write(f"**Impact:** {team_impact['impact']}")
        st.write(f"**Metric:** {team_impact['metric']}")
        st.write(f"**Value:** {team_impact['value']}")
        st.info(f"📈 {team_impact['business_outcome']}")

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
