#!/usr/bin/env python3
"""
Quick setup verification script.
Run this to make sure everything is installed and working.
"""

import sys
import importlib

required_packages = {
    'streamlit': 'Streamlit (dashboard framework)',
    'pandas': 'Pandas (data analysis)',
    'numpy': 'NumPy (numerical computing)',
    'plotly': 'Plotly (visualization)',
}

print("=" * 60)
print("🔍 Payment Settlement Dashboard - Setup Verification")
print("=" * 60)

# Check Python version
print(f"\n✓ Python version: {sys.version.split()[0]}")

# Check required packages
print("\nChecking required packages:")
all_good = True

for package, description in required_packages.items():
    try:
        importlib.import_module(package)
        print(f"  ✓ {package:15} - {description}")
    except ImportError:
        print(f"  ✗ {package:15} - NOT INSTALLED")
        all_good = False

# Check our modules
print("\nChecking project modules:")
try:
    import sample_data
    print(f"  ✓ sample_data     - Data generator")
except ImportError as e:
    print(f"  ✗ sample_data     - ERROR: {e}")
    all_good = False

try:
    import settlement_analyzer
    print(f"  ✓ settlement_analyzer - Analysis module")
except ImportError as e:
    print(f"  ✗ settlement_analyzer - ERROR: {e}")
    all_good = False

# Quick functionality test
print("\nTesting functionality:")
try:
    from sample_data import generate_settlement_data
    df = generate_settlement_data(days_back=3)
    print(f"  ✓ Data generation  - Created {len(df):,} transactions")
except Exception as e:
    print(f"  ✗ Data generation  - ERROR: {e}")
    all_good = False

try:
    from settlement_analyzer import SettlementAnalyzer
    analyzer = SettlementAnalyzer(df, use_mock=True)
    results = analyzer.analyze_settlement_data()
    print(f"  ✓ Analysis         - Detected {len(results['anomalies_detected'])} anomalies")
except Exception as e:
    print(f"  ✗ Analysis         - ERROR: {e}")
    all_good = False

# Summary
print("\n" + "=" * 60)
if all_good:
    print("✅ All checks passed! Ready to run:")
    print("\n   streamlit run app.py\n")
else:
    print(" Some checks failed. Run:")
    print("\n   pip install -r requirements.txt\n")
print("=" * 60)
