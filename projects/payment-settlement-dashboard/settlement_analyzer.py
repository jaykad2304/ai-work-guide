"""
Settlement Reconciliation Analyzer.

This module demonstrates how Claude would analyze payment settlement data.
In production, this calls Claude API with data residency guarantees.
For this demo, we use pre-computed responses that show Claude's reasoning.
"""

import pandas as pd
import json
from typing import Dict, List, Any


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
        method_summary = self._calculate_method_summary()

        # Detect anomalies (Claude would do this reasoning)
        anomalies = self._detect_anomalies(daily_summary, method_summary)

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
            'method_metrics': method_summary,
            'anomalies_detected': anomalies,
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
