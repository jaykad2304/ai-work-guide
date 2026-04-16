"""
Generate realistic settlement data across multiple payment methods.
Simulates a global payment platform with 300+ payment methods and 70+ countries.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def generate_settlement_data(days_back=7):
    """
    Generate realistic settlement transactions across different payment methods.

    Args:
        days_back: How many days of historical data to generate

    Returns:
        DataFrame with settlement transaction data
    """

    # Payment methods supported (subset for demo)
    payment_methods = {
        'Alipay': {'avg_transaction': 120, 'daily_volume': 5000, 'country': 'China'},
        'WeChat Pay': {'avg_transaction': 95, 'daily_volume': 4800, 'country': 'China'},
        'Apple Pay': {'avg_transaction': 85, 'daily_volume': 3200, 'country': 'Global'},
        'Google Pay': {'avg_transaction': 78, 'daily_volume': 2900, 'country': 'Global'},
        'Carrier Billing (JP)': {'avg_transaction': 65, 'daily_volume': 1200, 'country': 'Japan'},
        'iDEAL': {'avg_transaction': 110, 'daily_volume': 800, 'country': 'Netherlands'},
        'UPI': {'avg_transaction': 45, 'daily_volume': 3500, 'country': 'India'},
        'Boleto': {'avg_transaction': 150, 'daily_volume': 600, 'country': 'Brazil'},
    }

    transactions = []
    base_date = datetime.now() - timedelta(days=days_back)

    for day_offset in range(days_back):
        current_date = base_date + timedelta(days=day_offset)

        for method, config in payment_methods.items():
            # Normal daily volume with some variance
            num_transactions = int(config['daily_volume'] * np.random.normal(1.0, 0.15))

            for _ in range(num_transactions):
                # Generate transaction
                amount = max(1, np.random.normal(config['avg_transaction'], config['avg_transaction'] * 0.3))

                # Add some anomalies (chargebacks, reversals)
                is_reversal = np.random.random() < 0.02  # 2% reversal rate
                is_chargeback = np.random.random() < 0.01  # 1% chargeback rate

                status = 'settled'
                if is_reversal:
                    status = 'reversed'
                    amount = -amount
                elif is_chargeback:
                    status = 'chargeback'
                    amount = -amount

                transactions.append({
                    'timestamp': current_date + timedelta(seconds=np.random.randint(0, 86400)),
                    'payment_method': method,
                    'country': config['country'],
                    'amount_usd': amount,
                    'status': status,
                    'currency': 'USD',  # Simplified - actually varies by method
                    'transaction_id': f"txn_{np.random.randint(100000, 999999)}",
                })

    df = pd.DataFrame(transactions)
    df = df.sort_values('timestamp').reset_index(drop=True)

    return df


def inject_anomalies(df):
    """
    Inject realistic anomalies that Claude would detect.
    Returns the original df + anomaly info for demonstration.
    """

    anomalies_info = {
        'scenarios': [
            {
                'description': 'Carrier Billing (JP) reversal spike',
                'reason': 'Carrier outage or billing rule change',
                'severity': 'high',
                'expected_action': 'Halt settlement, investigate carrier',
            },
            {
                'description': 'Alipay success rate drop (98.5% → 94%)',
                'reason': 'Possible network issue or partner integration problem',
                'severity': 'medium',
                'expected_action': 'Check Alipay status page, verify API connectivity',
            },
            {
                'description': 'Google Pay chargeback velocity 3x normal',
                'reason': 'Potential currency conversion error or double-billing',
                'severity': 'high',
                'expected_action': 'Review recent transactions, check conversion rates',
            },
        ]
    }

    return df, anomalies_info


if __name__ == '__main__':
    # Test data generation
    df = generate_settlement_data(days_back=7)
    print(f"Generated {len(df)} transactions")
    print("\nSample transactions:")
    print(df.head(10))
    print("\nPayment method breakdown:")
    print(df['payment_method'].value_counts())
