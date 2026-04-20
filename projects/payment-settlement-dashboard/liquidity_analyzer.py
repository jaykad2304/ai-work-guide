import pandas as pd
from datetime import timedelta

def forecast_settlement_timing(transactions_df):
    """
    Forecast when each transaction will settle based on payment method and country.

    Settlement timing varies by regulatory jurisdiction:
    - T+1: Most developed markets (US, UK, EU) - next-day clearing
    - T+3 to T+5: Emerging markets (India, Brazil) - slower clearing infrastructure
    - T+7: High-touch settlements requiring manual intervention

    Returns DataFrame with columns:
    - payment_method, country, timestamp, settlement_date, days_to_settle
    """

    # Settlement timing rules by payment method + region
    # Key insight: Settlement timing is largely determined by country regulations, not method
    settlement_rules = {
        ('Google Pay', 'US'): 1,
        ('Google Pay', 'GB'): 1,
        ('Google Pay', 'IN'): 3,
        ('Google Pay', 'BR'): 5,
        ('Apple Pay', 'US'): 1,
        ('Apple Pay', 'GB'): 1,
        ('Apple Pay', 'IN'): 3,
        ('Apple Pay', 'BR'): 5,
        ('Carrier Billing', 'US'): 2,
        ('Carrier Billing', 'IN'): 7,
        ('Carrier Billing', 'BR'): 7,
        ('Digital Wallet', 'US'): 2,
        ('Digital Wallet', 'IN'): 5,
        ('Digital Wallet', 'BR'): 7,
        ('Bank Transfer', 'GB'): 3,
        ('Bank Transfer', 'IN'): 5,
        ('Bank Transfer', 'BR'): 5,
        # Add more payment methods to the rules dict
        ('Alipay', 'CN'): 1,
        ('Alipay', 'IN'): 3,
        ('WeChat Pay', 'CN'): 1,
        ('Klarna', 'GB'): 2,
        ('Klarna', 'DE'): 2,
    }

    result = transactions_df.copy()

    # Map settlement days using the rules above
    # Default to 3 days if method/country combination not found
    result['days_to_settle'] = result.apply(
        lambda row: settlement_rules.get(
            (row['payment_method'], row['country']), 3
        ), axis=1
    )

    # Calculate when the settlement will complete
    result['settlement_date'] = pd.to_datetime(result['timestamp']) + \
        pd.to_timedelta(result['days_to_settle'], unit='D')

    return result[['payment_method', 'country', 'timestamp',
                   'settlement_date', 'days_to_settle']]


def get_settlement_timing_summary(forecast_df):
    """
    Summarize settlement timing: which methods settle when?
    Returns a clean table for dashboard display.

    Useful for: Understanding cash flow timing, identifying slow settlement methods,
    planning when to expect funds.
    """
    summary = forecast_df.groupby(['payment_method', 'country']).agg({
        'days_to_settle': 'first',
        'timestamp': 'count'  # Number of transactions using this method/country
    }).reset_index()

    summary.columns = ['Payment Method', 'Country', 'Days to Settle', 'Transaction Count']
    return summary.sort_values('Days to Settle')


def forecast_currency_position(transactions_df, forecast_df):
    """
    Forecast daily cash position by currency.

    Shows: On each day, how much cash in each currency is waiting to settle?
    Helps identify where cash gets stuck in "wrong" currencies.

    Problem it solves: Boku holds $10B across 50+ currencies. You might have
    ₹50M waiting to settle but urgently need £2M to pay UK partners.
    Without visibility, you don't know if you can make the payment or need to convert.

    Returns DataFrame: settlement_date, currency, amount_pending_settlement
    """

    # Merge transactions with forecast data
    merged = transactions_df.merge(
        forecast_df[['timestamp', 'settlement_date', 'days_to_settle']],
        left_on='timestamp',
        right_on='timestamp',
        how='left'
    )

    # Map country to currency (simplified: use country for currency)
    # In reality, Boku would use actual merchant currency selection
    currency_map = {
        'US': 'USD',
        'GB': 'GBP',
        'IN': 'INR',
        'BR': 'BRL',
        'DE': 'EUR',
        'JP': 'JPY',
        'CN': 'CNY',
    }

    merged['currency'] = merged['country'].map(currency_map).fillna('USD')

    # Group by settlement_date and currency to get position
    position = merged.groupby(['settlement_date', 'currency']).agg({
        'amount_usd': 'sum'
    }).reset_index()

    position.columns = ['Settlement Date', 'Currency', 'Amount Pending']
    return position.sort_values('Settlement Date')


def get_currency_position_summary(position_df):
    """
    Create a summary: for each currency, total waiting across all settlement dates.
    Identifies which currencies have "stuck" cash.

    Risk Level logic:
    - High: >$50K stuck (significant FX exposure, liquidity risk)
    - Medium: $20K-$50K (moderate exposure)
    - Low: <$20K (minimal impact)
    """
    summary = position_df.groupby('Currency').agg({
        'Amount Pending': 'sum'
    }).reset_index().sort_values('Amount Pending', ascending=False)

    summary['Risk Level'] = summary['Amount Pending'].apply(
        lambda x: 'High' if x > 50000 else ('Medium' if x > 20000 else 'Low')
    )

    return summary


def identify_data_challenges(transactions_df, forecast_df):
    """
    Identify real data challenges that affect forecast accuracy for each payment method.

    This is the "backdrop" — why forecasting is hard in production Boku systems.

    These are real constraints that break forecasting:
    - API latency: Partner APIs report settlement with delays
    - Reconciliation gaps: Some transactions lack settlement confirmation
    - FX timing: Rates change after forecast is locked
    - Multi-leg settlements: Each intermediary adds delays
    """

    challenges_by_method = {
        'Google Pay': [
            'Settlement data arrives 6 hours late from Google API',
            'Occasional reconciliation gaps (1-2% of transactions)',
            'FX rates impact final settlement amount (INR/GBP conversion)',
        ],
        'Apple Pay': [
            'Multi-leg settlement (Apple → Processor → Boku → Merchant)',
            'Chargeback reconciliation delayed 3-5 days',
            'Partner API rate limits cause data delays',
        ],
        'Carrier Billing': [
            'MNO (Mobile Network Operator) settlements highly variable (T+3 to T+7)',
            'Roaming transactions settle in originating country, not home country',
            'Chargebacks can occur 90+ days after transaction',
        ],
        'Digital Wallet': [
            'Settlement amounts adjusted post-facto (fee reconciliation)',
            'Partner API frequently times out during high-volume periods',
            'Currency conversion rates locked only at settlement, not transaction',
        ],
        'Bank Transfer': [
            'Regulatory holds (AML/PSD2) can delay settlement 24-48 hours',
            'Multi-currency transfers settle in stages (intermediary bank delays)',
            'Failed transfers require manual investigation and reversal',
        ],
    }

    result = transactions_df.copy()
    result['data_challenges'] = result['payment_method'].map(challenges_by_method)

    return result[['payment_method', 'country', 'data_challenges']]


def get_data_challenges_summary():
    """
    Unified list of data challenges across all payment methods.
    Used for dashboard 'Backdrop' section.

    KEY INSIGHT FOR INTERVIEW:
    Most people think "we need a better algorithm"
    The real bottleneck is "our data is 6+ hours stale and 2% incomplete"
    You can't automate without solving data problems first.
    """
    challenges = {
        'Settlement Timing': 'Partner APIs report settlements with 6-24 hour delays',
        'Reconciliation Gaps': '1-3% of transactions have delayed reconciliation records',
        'Multi-Leg Settlements': 'Intermediaries add 1-3 days to settlement time',
        'FX Volatility': 'Final settlement amount differs from transaction FX rate',
        'Partner Reliability': 'API outages/rate limits affect data freshness',
        'Regulatory Holds': 'AML/PSD2 rules can delay settlement 24-48 hours',
        'Chargeback Delays': 'Disputes reported 3-90 days after transaction',
    }

    return challenges
