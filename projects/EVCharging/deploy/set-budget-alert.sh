#!/usr/bin/env bash
# Creates a monthly budget for one client's project with alerts at 50%, 80% and 100%.
# Usage:
#   BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX PROJECT_NUMBER=123456789012 PROJECT_ID=evc-client-a AMOUNT=5000 \
#     ./deploy/set-budget-alert.sh
set -euo pipefail

: "${BILLING_ACCOUNT:?set BILLING_ACCOUNT (billing account id)}"
: "${PROJECT_NUMBER:?set PROJECT_NUMBER (numeric project number)}"
: "${PROJECT_ID:?set PROJECT_ID (for the budget name)}"
: "${AMOUNT:?set AMOUNT (monthly budget, in the billing account currency)}"

gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT" \
  --display-name="evc-${PROJECT_ID}-monthly" \
  --budget-amount="$AMOUNT" \
  --filter-projects="projects/${PROJECT_NUMBER}" \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.8 \
  --threshold-rule=percent=1.0
