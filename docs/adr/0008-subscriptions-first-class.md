# ADR 0008 — Subscriptions Are a First-Class Commerce Domain

## Decision

Model `Plan`, `Subscription`, `Payment`, and `Entitlement` as separate authoritative domains/records.

## Context

A payment represents a financial event. A subscription represents a recurring commercial agreement. An entitlement represents the access actually granted. Collapsing these concepts makes renewal, cancellation, refunds, grace periods, plan changes, reconciliation and access repair unsafe.

## Consequences

- `subscriptions` is a dedicated Appwrite table/domain record.
- Subscription lifecycle has its own state machine.
- Provider-specific subscription identifiers remain on commerce records.
- Payment success does not directly imply entitlement.
- Renewal and cancellation are subscription events, not merely payment status changes.
- Entitlement synchronization is idempotent and auditable.
- Cloudflare Workflows may repair/reconcile subscriptions but is never the subscription source of truth.

## Provider-independent billing strategy

StoryGalore owns the subscription lifecycle independently of payment-provider subscription capabilities. Payment providers expose capabilities, and the subscription billing engine selects one of three strategies: `NATIVE_RECURRING`, `MERCHANT_MANAGED`, or `MANUAL`.

`MERCHANT_MANAGED` is the compatibility path for processors that support one-time payments but not recurring billing. StoryGalore creates a new renewal payment request for each billing period and requires a fresh user-authorized payment. It must never manufacture automatic wallet debits or imply that the provider supports recurring authorization.

The application exposes one Subscription API while provider-specific behavior remains behind payment adapters and billing strategies. Cloudflare Workflows may orchestrate renewal workflows, but payment, subscription, and entitlement records remain authoritative.
