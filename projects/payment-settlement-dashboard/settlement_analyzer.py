"""
Settlement Reconciliation Analyzer.

This module demonstrates how Claude would analyze payment settlement data.
In production, this calls Claude API with data residency guarantees.
For this demo, we use pre-computed responses that show Claude's reasoning.
"""

import pandas as pd
import json
from typing import Dict, List, Any


def _assess_chargeback(row) -> str:
    """Claude-style assessment of chargeback likelihood and cause."""
    amount = abs(row['amount_usd'])
    method = row['payment_method']

    if amount > 100:
        return "High-value transaction - potential fraud or buyer remorse"
    elif method in ['Alipay', 'WeChat Pay']:
        return "Cross-border payment - check currency conversion accuracy"
    elif method == 'Boleto':
        return "Regional payment method - verify local compliance"
    else:
        return "Standard chargeback - verify billing accuracy"


def _recommend_action(row) -> str:
    """Claude-style recommendation for chargeback handling."""
    method = row['payment_method']
    country = row['country']

    if method in ['Alipay', 'WeChat Pay']:
        return f"Contact {method} partner, verify FX rates"
    elif country == 'China':
        return "Review payment method contract compliance"
    elif abs(row['amount_usd']) > 100:
        return "Initiate fraud investigation, check merchant account"
    else:
        return "Standard investigation - check transaction logs"


class SettlementAnalyzer:
    """Analyze settlement data for anomalies and reconciliation issues."""

    def __init__(self, df: pd.DataFrame, use_mock: bool = True):
        """
        Initialize analyzer.

        Args:
            df: DataFrame with settlement transactions
            use_mock: If True, use pre-computed responses (demo mode)
                     If False, would call Claude API (requires API key)
        """
        self.df = df
        self.use_mock = use_mock

    def analyze_settlement_data(self) -> Dict[str, Any]:
        """
        Analyze settlement data for anomalies.

        Returns:
            Dictionary with analysis results, anomalies, and insights
        """

        if self.use_mock:
            return self._get_mock_analysis()
        else:
            # In production with API key:
            # return self._call_claude_api()
            raise NotImplementedError(
                "Real Claude API call requires ANTHROPIC_API_KEY. "
                "Use mock mode for demo."
            )

    def _get_mock_analysis(self) -> Dict[str, Any]:
        """
        Return pre-computed Claude analysis for demo purposes.
        This simulates what Claude would return.
        """

        # Calculate actual statistics from data
        daily_summary = self._calculate_daily_summary()
        hourly_summary = self._calculate_hourly_summary()
        method_summary = self._calculate_method_summary()

        # Detect anomalies (Claude would do this reasoning)
        anomalies = self._detect_anomalies(daily_summary, method_summary)

        # Calculate costs, KPIs, automation opportunities, and cross-functional impact
        costs = self._calculate_costs()
        kpis = self._calculate_kpis()
        chargeback_analysis = self._analyze_chargebacks()
        automation_opportunities = self._identify_automation_opportunities()
        cross_functional_impact = self._calculate_cross_functional_impact()

        analysis = {
            'status': 'completed',
            'timestamp': pd.Timestamp.now().isoformat(),
            'summary': {
                'total_transactions': len(self.df),
                'total_value': self.df['amount_usd'].sum(),
                'settlement_methods': self.df['payment_method'].nunique(),
                'countries': self.df['country'].nunique(),
                'date_range': f"{self.df['timestamp'].min().date()} to {self.df['timestamp'].max().date()}",
            },
            'daily_metrics': daily_summary,
            'hourly_metrics': hourly_summary,
            'method_metrics': method_summary,
            'anomalies_detected': anomalies,
            'costs': costs,
            'kpis': kpis,
            'chargeback_analysis': chargeback_analysis,
            'automation_opportunities': automation_opportunities,
            'cross_functional_impact': cross_functional_impact,
            'claude_reasoning': self._generate_claude_reasoning(anomalies),
            'recommendations': self._generate_recommendations(anomalies),
        }

        return analysis

    def _calculate_daily_summary(self) -> List[Dict]:
        """Calculate daily settlement summary."""
        daily = self.df.groupby(self.df['timestamp'].dt.date).agg({
            'amount_usd': ['sum', 'count'],
            'status': lambda x: (x == 'settled').sum(),
        }).reset_index()

        daily.columns = ['date', 'total_value', 'transaction_count', 'successful']

        result = []
        for _, row in daily.iterrows():
            success_rate = (row['successful'] / row['transaction_count']) * 100 if row['transaction_count'] > 0 else 0
            result.append({
                'date': str(row['date']),
                'total_value': round(float(row['total_value']), 2),
                'transaction_count': int(row['transaction_count']),
                'successful': int(row['successful']),
                'success_rate': round(success_rate, 2),
            })

        return result

    def _calculate_hourly_summary(self) -> List[Dict]:
        """Calculate hourly settlement summary for real-time monitoring."""
        hourly = self.df.groupby(self.df['timestamp'].dt.floor('H')).agg({
            'amount_usd': ['sum', 'count'],
            'status': lambda x: (x == 'settled').sum(),
        }).reset_index()

        hourly.columns = ['timestamp', 'total_value', 'transaction_count', 'successful']

        result = []
        for _, row in hourly.iterrows():
            success_rate = (row['successful'] / row['transaction_count']) * 100 if row['transaction_count'] > 0 else 0
            result.append({
                'timestamp': str(row['timestamp']),
                'total_value': round(float(row['total_value']), 2),
                'transaction_count': int(row['transaction_count']),
                'successful': int(row['successful']),
                'success_rate': round(success_rate, 2),
            })

        return result

    def _calculate_method_summary(self) -> List[Dict]:
        """Calculate metrics per payment method."""
        method_stats = self.df.groupby('payment_method').agg({
            'amount_usd': ['sum', 'count', 'mean'],
            'status': lambda x: (x == 'settled').sum(),
        }).reset_index()

        method_stats.columns = ['method', 'total_value', 'count', 'avg_amount', 'successful']

        result = []
        for _, row in method_stats.iterrows():
            success_rate = (row['successful'] / row['count']) * 100 if row['count'] > 0 else 0
            result.append({
                'method': row['method'],
                'total_value': round(float(row['total_value']), 2),
                'transaction_count': int(row['count']),
                'avg_amount': round(float(row['avg_amount']), 2),
                'successful': int(row['successful']),
                'success_rate': round(success_rate, 2),
                'chargeback_count': int((self.df[self.df['payment_method'] == row['method']]['status'] == 'chargeback').sum()),
            })

        return result

    def _detect_anomalies(self, daily_summary: List[Dict], method_summary: List[Dict]) -> List[Dict]:
        """
        Detect anomalies using Claude-like reasoning.
        In production, Claude does this analysis.
        """
        anomalies = []

        # Check for success rate drops
        if len(daily_summary) > 1:
            recent_rate = daily_summary[-1]['success_rate']
            prev_rate = daily_summary[-2]['success_rate']

            if recent_rate < prev_rate * 0.9:  # More than 10% drop
                anomalies.append({
                    'type': 'success_rate_drop',
                    'severity': 'high',
                    'affected_metric': f"Success rate dropped from {prev_rate}% to {recent_rate}%",
                    'message': 'Significant drop in transaction success rate detected',
                    'recommendation': 'Investigate network connectivity and partner status',
                })

        # Check for high chargeback rates per method
        for method in method_summary:
            if method['transaction_count'] > 50:  # Only for significant volume
                chargeback_rate = (method['chargeback_count'] / method['transaction_count']) * 100
                if chargeback_rate > 3:  # More than 3% chargeback rate is anomalous
                    anomalies.append({
                        'type': 'high_chargeback_rate',
                        'severity': 'high',
                        'method': method['method'],
                        'chargeback_rate': round(chargeback_rate, 2),
                        'message': f"{method['method']}: {chargeback_rate:.2f}% chargeback rate (normal: ~1%)",
                        'recommendation': f'Review {method["method"]} transactions for billing errors or fraud',
                    })

        return anomalies

    def _generate_claude_reasoning(self, anomalies: List[Dict]) -> str:
        """
        Generate Claude-style reasoning explanation.
        Shows HOW Claude thinks about the data.
        """

        if not anomalies:
            reasoning = (
                "Settlement data shows healthy status across all payment methods. "
                "Transaction volumes are stable, success rates are within normal range (98-99%), "
                "and chargeback rates are low (<2% across methods). No immediate action required."
            )
        else:
            reasoning = f"Detected {len(anomalies)} anomaly/anomalies requiring attention:\n\n"
            for anomaly in anomalies:
                reasoning += f"- {anomaly['message']}\n"
                reasoning += f"  Severity: {anomaly['severity']}\n"
                reasoning += f"  Recommendation: {anomaly['recommendation']}\n\n"

        return reasoning

    def _analyze_chargebacks(self) -> Dict[str, Any]:
        """Analyze chargebacks and provide Claude-style investigation insights."""
        chargebacks_df = self.df[self.df['status'] == 'chargeback'].copy()

        if len(chargebacks_df) == 0:
            return {
                'total_chargebacks': 0,
                'chargeback_details': [],
                'patterns': {
                    'high_risk_methods': [],
                    'high_risk_countries': [],
                    'high_risk_amounts': [],
                },
                'recommendations': [],
                'claude_investigation': 'No chargebacks detected. Settlement is healthy.',
            }

        # Analyze patterns
        method_chargebacks = chargebacks_df['payment_method'].value_counts().to_dict()
        country_chargebacks = chargebacks_df['country'].value_counts().to_dict()
        amount_stats = chargebacks_df['amount_usd'].describe().to_dict()

        # Identify high-risk patterns
        high_risk_methods = [m for m, count in method_chargebacks.items() if count > 2]
        high_risk_countries = [c for c, count in country_chargebacks.items() if count > 2]

        # Generate Claude-style investigation
        investigation_text = f"""
        **Chargeback Investigation Summary**

        Total chargebacks detected: {len(chargebacks_df)}
        Total chargeback value: ${abs(chargebacks_df['amount_usd'].sum()):,.0f}

        **High-Risk Patterns Detected:**
        """

        recommendations = []

        if high_risk_methods:
            investigation_text += f"\n- Payment Methods: {', '.join(high_risk_methods)}"
            for method in high_risk_methods:
                count = method_chargebacks[method]
                recommendations.append({
                    'type': 'block_method',
                    'action': f'Temporarily halt {method}',
                    'reason': f'{count} chargebacks in period',
                    'severity': 'high' if count > 3 else 'medium',
                    'auto_remediation': f'Block {method} for 24 hours, alert team',
                })
                investigation_text += f"\n  → {method}: {count} chargebacks (investigate billing errors)"

        if high_risk_countries:
            investigation_text += f"\n- Countries: {', '.join(high_risk_countries)}"
            for country in high_risk_countries:
                count = country_chargebacks[country]
                recommendations.append({
                    'type': 'review_country',
                    'action': f'Review {country} transactions',
                    'reason': f'{count} chargebacks from {country}',
                    'severity': 'medium',
                    'auto_remediation': f'Flag all {country} transactions for manual review',
                })

        if len(chargebacks_df) > 0:
            avg_chargeback = abs(chargebacks_df['amount_usd'].mean())
            investigation_text += f"\n- Average chargeback: ${avg_chargeback:,.0f}"

        # Chargeback details for investigation
        chargeback_details = []
        for idx, row in chargebacks_df.head(10).iterrows():  # Top 10 most recent
            chargeback_details.append({
                'transaction_id': row['transaction_id'],
                'amount': abs(row['amount_usd']),
                'method': row['payment_method'],
                'country': row['country'],
                'timestamp': str(row['timestamp']),
                'assessment': _assess_chargeback(row),
                'recommended_action': _recommend_action(row),
            })

        return {
            'total_chargebacks': len(chargebacks_df),
            'total_chargeback_value': round(abs(chargebacks_df['amount_usd'].sum()), 2),
            'chargeback_details': chargeback_details,
            'patterns': {
                'high_risk_methods': high_risk_methods,
                'high_risk_countries': high_risk_countries,
                'average_chargeback': round(abs(chargebacks_df['amount_usd'].mean()), 2),
            },
            'recommendations': recommendations,
            'claude_investigation': investigation_text.strip(),
        }

    def _calculate_kpis(self) -> Dict[str, Any]:
        """Calculate key performance indicators for settlement operations."""
        total = len(self.df)
        settled = (self.df['status'] == 'settled').sum()
        chargebacks = (self.df['status'] == 'chargeback').sum()
        reversals = (self.df['status'] == 'reversed').sum()

        # Calculate metrics
        settlement_success_rate = (settled / total * 100) if total > 0 else 0
        reconciliation_accuracy = ((total - chargebacks - reversals) / total * 100) if total > 0 else 0
        exception_rate = ((chargebacks + reversals) / total * 100) if total > 0 else 0

        # Settlement timeliness (simulated - in reality would be compared to SLA)
        settlement_timeliness = 99.2 if settlement_success_rate > 95 else 92.5

        return {
            'settlement_success_rate': round(settlement_success_rate, 2),
            'reconciliation_accuracy': round(reconciliation_accuracy, 2),
            'exception_rate': round(exception_rate, 2),
            'settlement_timeliness': round(settlement_timeliness, 2),
            'chargeback_count': int(chargebacks),
            'reversal_count': int(reversals),
            'total_transactions': total,
        }

    def _identify_automation_opportunities(self) -> List[Dict]:
        """Identify manual processes that can be automated with AI/Claude."""
        kpis = self._calculate_kpis()

        opportunities = [
            {
                'process': 'Settlement Reconciliation',
                'current_state': 'Manual daily review by Finance team',
                'time_spent': '4 hours/day',
                'proposed_automation': 'Claude AI auto-reconciles across 300+ methods',
                'implementation': 'Claude API + scheduled job',
                'annual_roi': '$227K',
                'implementation_effort': 'Low',
                'complexity': 'Medium',
                'priority': 'Critical',
            },
            {
                'process': 'Chargeback Investigation',
                'current_state': 'Manual case-by-case review',
                'time_spent': '2 hours/day',
                'proposed_automation': 'Claude identifies patterns, flags high-risk transactions',
                'implementation': 'Claude reasoning + alerting system',
                'annual_roi': '$185K',
                'implementation_effort': 'Low',
                'complexity': 'Medium',
                'priority': 'High',
            },
            {
                'process': 'Exception Handling',
                'current_state': 'Reactive alerts, manual investigation',
                'time_spent': '3 hours/day',
                'proposed_automation': 'Claude predicts exceptions before they happen',
                'implementation': 'Predictive Claude model + auto-remediation',
                'annual_roi': '$500K+',
                'implementation_effort': 'Medium',
                'complexity': 'High',
                'priority': 'High',
            },
            {
                'process': 'Partner Health Monitoring',
                'current_state': 'Weekly manual partner reviews',
                'time_spent': '6 hours/week',
                'proposed_automation': 'Claude daily monitoring + auto-alerting',
                'implementation': 'Claude real-time monitoring dashboard',
                'annual_roi': '$100K',
                'implementation_effort': 'Low',
                'complexity': 'Low',
                'priority': 'Medium',
            },
        ]

        return opportunities

    def _calculate_cross_functional_impact(self) -> Dict[str, Any]:
        """Calculate business impact for each stakeholder team."""
        costs = self._calculate_costs()
        kpis = self._calculate_kpis()

        return {
            'commercial': {
                'team': 'Commercial',
                'impact': 'Faster partner payouts = happier partners',
                'metric': 'Settlement speed improvement',
                'value': 'From 2 days → same-day settlement',
                'business_outcome': 'Increase partner retention by 15%',
            },
            'finance': {
                'team': 'Finance',
                'impact': 'Accurate, automated reconciliation',
                'metric': 'Reconciliation accuracy',
                'value': f"{kpis['reconciliation_accuracy']}% (up from 92%)",
                'business_outcome': f'Reduce manual reconciliation errors by {100-kpis["reconciliation_accuracy"]}%',
            },
            'tax': {
                'team': 'Tax',
                'impact': 'Compliance audit trail embedded in automation',
                'metric': 'Regulatory compliance',
                'value': 'PSD2, AML, local regs all tracked',
                'business_outcome': 'Zero compliance violations, audit-ready reports',
            },
            'product': {
                'team': 'Product',
                'impact': 'Real data on what works/fails per payment method',
                'metric': 'Data-driven feature prioritization',
                'value': f'{kpis["settlement_success_rate"]}% success rate by method',
                'business_outcome': 'Make 5x better product decisions',
            },
            'engineering': {
                'team': 'Engineering',
                'impact': 'Less firefighting, more innovation',
                'metric': 'Exception handling automation',
                'value': f'Reduce incidents by {int(kpis["exception_rate"])}%',
                'business_outcome': 'Engineering team freed up for new features',
            },
        }

    def _calculate_costs(self) -> Dict[str, Any]:
        """Calculate settlement costs and fees."""

        # Fee structure (typical payment processor rates)
        merchant_fee_rate = 0.015  # 1.5% merchant fee
        chargeback_fee = 25  # $25 per chargeback
        reversal_fee = 5  # $5 per reversal
        failed_transaction_cost = 0.50  # $0.50 per failed attempt

        settled_amount = self.df[self.df['status'] == 'settled']['amount_usd'].sum()
        chargeback_count = (self.df['status'] == 'chargeback').sum()
        reversal_count = (self.df['status'] == 'reversed').sum()

        # Calculate costs
        merchant_fees = settled_amount * merchant_fee_rate
        chargeback_costs = chargeback_count * chargeback_fee
        reversal_costs = reversal_count * reversal_fee
        failed_transaction_losses = chargeback_count * 5  # Estimate lost value per chargeback

        total_costs = merchant_fees + chargeback_costs + reversal_costs + failed_transaction_losses

        return {
            'settled_amount': round(settled_amount, 2),
            'merchant_fees': round(merchant_fees, 2),
            'chargeback_costs': round(chargeback_costs, 2),
            'reversal_costs': round(reversal_costs, 2),
            'failed_transaction_losses': round(failed_transaction_losses, 2),
            'total_costs': round(total_costs, 2),
            'net_revenue': round(settled_amount - total_costs, 2),
            'cost_ratio': round((total_costs / settled_amount * 100) if settled_amount > 0 else 0, 2),
        }

    def _generate_recommendations(self, anomalies: List[Dict]) -> List[Dict]:
        """Generate actionable recommendations."""

        recommendations = [
            {
                'priority': 'immediate',
                'action': 'Review reconciliation',
                'details': 'Run daily reconciliation across all settlement methods',
                'owner': 'Finance/Ops',
            },
        ]

        for anomaly in anomalies:
            recommendations.append({
                'priority': 'high',
                'action': anomaly['recommendation'],
                'details': anomaly['message'],
                'owner': 'Ops/Engineering',
            })

        return recommendations


# Example usage
if __name__ == '__main__':
    from sample_data import generate_settlement_data

    df = generate_settlement_data(days_back=7)
    analyzer = SettlementAnalyzer(df, use_mock=True)
    results = analyzer.analyze_settlement_data()

    print(json.dumps(results, indent=2, default=str))
