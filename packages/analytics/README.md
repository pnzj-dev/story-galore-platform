# Product analytics package — implementation target

This directory is the planned provider-neutral product-analytics package. It is a specification placeholder, not a claim that the runtime package is implemented or published.

## Required interface

- Provider-neutral `ProductAnalytics` interface.
- Consent/privacy gate before event dispatch.
- Non-blocking ingestion; analytics failure must not fail a domain operation.
- `Noop` and deterministic test adapters.
- Provider adapters, including PostHog, behind an explicit adapter boundary.
- No financial, payment, entitlement, moderation, privacy, audit, or authoritative domain state in the analytics provider.

## PostHog adapter target

The PostHog adapter is planned under `packages/analytics/providers/posthog/` and must be implemented only after its contract, dependency version, consent mapping, deletion propagation, and tests are registered. It is not implemented by this README.

