"""
Price Fetcher Agent - Fetches current price and technical data for a stock.
Uses yfinance for Yahoo Finance data and NSE/Yahoo for Indian stocks.
"""

import os
import json
import asyncio
from typing import Optional

import yfinance as yf
from dotenv import load_dotenv

load_dotenv()


class PriceFetcher:
    def __init__(self):
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

    def fetch_stock_data(self, ticker: str) -> dict:
        """
        Fetch current price and technical data for a stock.

        Args:
            ticker: Stock ticker (e.g., "TSLA", "RELIANCE.NS" for NSE)

        Returns:
            Dict with price data and technical indicators
        """
        try:
            stock = yf.Ticker(ticker)

            # Get current data
            hist = stock.history(period="1y")
            info = stock.info

            if len(hist) == 0:
                return {
                    "error": f"No data found for ticker {ticker}",
                    "ticker": ticker,
                }

            # Get latest data
            latest = hist.iloc[-1]

            # Calculate technical indicators
            sma_50 = hist['Close'].rolling(window=50).mean().iloc[-1]
            sma_200 = hist['Close'].rolling(window=200).mean().iloc[-1]

            # Volatility (standard deviation of returns)
            returns = hist['Close'].pct_change()
            volatility = returns.std() * (252 ** 0.5)  # Annualized

            # Price change percentage
            current_price = latest['Close']
            prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
            price_change_pct = ((current_price - prev_close) / prev_close) * 100

            return {
                "ticker": ticker,
                "current_price": float(current_price),
                "previous_close": float(prev_close),
                "price_change_pct": float(price_change_pct),
                "day_high": float(latest['High']),
                "day_low": float(latest['Low']),
                "volume": float(latest['Volume']),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "52week_high": info.get("fiftyTwoWeekHigh"),
                "52week_low": info.get("fiftyTwoWeekLow"),
                "sma_50": float(sma_50) if not sma_50 != sma_50 else None,
                "sma_200": float(sma_200) if not sma_200 != sma_200 else None,
                "volatility": float(volatility),
            }
        except Exception as e:
            return {
                "error": f"Failed to fetch data for {ticker}: {str(e)}",
                "ticker": ticker,
            }

    async def analyze(self, ticker: str) -> dict:
        """
        Analyze stock price data and technical indicators.

        Args:
            ticker: Stock ticker (e.g., "TSLA")

        Returns:
            Dict with price analysis
        """
        data = self.fetch_stock_data(ticker)

        if "error" in data:
            return {
                "ticker": ticker,
                "status": "error",
                "error": data["error"],
            }

        # Determine trend based on SMA
        trend = "unknown"
        if data["sma_50"] and data["sma_200"]:
            if data["sma_50"] > data["sma_200"]:
                trend = "uptrend"
            else:
                trend = "downtrend"

        return {
            "ticker": ticker,
            "current_price": data["current_price"],
            "price_change_pct": data["price_change_pct"],
            "volatility": data["volatility"],
            "trend": trend,
            "pe_ratio": data.get("pe_ratio"),
            "52week_high": data.get("52week_high"),
            "52week_low": data.get("52week_low"),
            "volume": data["volume"],
            "technical_summary": {
                "sma_50": data["sma_50"],
                "sma_200": data["sma_200"],
                "day_high": data["day_high"],
                "day_low": data["day_low"],
            }
        }


async def main():
    """Test the Price Fetcher agent."""
    fetcher = PriceFetcher()

    # Test with sample tickers
    result_us = await fetcher.analyze("TSLA")
    print("US Stock (TSLA):")
    print(json.dumps(result_us, indent=2))

    result_nse = await fetcher.analyze("RELIANCE.NS")
    print("\nNSE Stock (RELIANCE):")
    print(json.dumps(result_nse, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
