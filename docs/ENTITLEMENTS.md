# Entitlements — Canonical Implementation Contract

Entitlements are the authoritative access grants between payment/subscription state and the Policy Engine. Payment success MUST NOT directly grant access.

## Ownership
- Subscription owns commercial lifecycle.
- Payment owns financial/provider truth.
- Entitlement owns access grant lifecycle.
- Policy Engine decides whether a grant may be exercised in a context.

## Canonical states
`PENDING`, `ACTIVE`, `GRACE`, `SUSPENDED`, `EXPIRED`, `REVOKED`.

## Required invariants
- Every externally visible mutation is idempotent.
- Entitlement changes are authorized server-side.
- Expiration/revocation is monotonic unless an explicit repair command is authorized and audited.
- Historical grant/revocation events are append-only.
- Search, recommendation, reader, download, API, MCP and CDN authorization MUST consume the same entitlement decision path.
- Entitlement records contain no provider secrets or payment credentials.

## Reconciliation
Payment/subscription reconciliation MAY request entitlement reconciliation. The entitlement record remains authoritative for the resulting access grant; reconciliation never trusts a client redirect.
