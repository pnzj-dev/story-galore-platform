# Deterministic Implementation Contracts

These contracts close implementation gaps identified in the V17.6 architecture audit. They do not replace domain contracts; they define the canonical persistence, API, state, failure, and source-of-truth rules that coding agents must follow.

## Universal invariants
- Domain/source-of-truth records are authoritative; projections, search, recommendations, realtime, and analytics are rebuildable unless explicitly marked authoritative.
- Every externally visible mutation requires authorization and idempotency.
- State-machine legality and Policy Engine authorization are separate decisions.
- Provider callbacks/webhooks are normalized before domain mutation.
- Client redirects are never authoritative for payment, subscription, entitlement, or publication state.
- Secrets, payment credentials, raw private messages, and unnecessary PII are excluded from agent projections, audit logs, analytics, and workflow history.
- Durable operations use Cloudflare Workflows; ordinary CRUD does not.
- Failed retries MUST be safe to replay.
