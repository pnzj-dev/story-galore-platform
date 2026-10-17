# Financial Invariants — V17.1

The following are distinct states:

`paymentSucceeded != subscriptionActive != entitlementGranted`

All payment provider webhooks are authenticated, immutably received, deduplicated, normalized, and processed idempotently.

The system MUST handle duplicate and out-of-order webhooks, retries, refunds, partial refunds, chargebacks, cancellations, expiration, provider outages, and reconciliation gaps.

Money calculations use explicit currency precision and deterministic rounding rules. Financial ledgers are authoritative; analytics projections are rebuildable.
