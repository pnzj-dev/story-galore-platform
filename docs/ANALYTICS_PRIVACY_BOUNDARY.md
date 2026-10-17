# Analytics Privacy Boundary

## Classification
PostHog receives only product-analytics data classified as permitted for telemetry. SECRET data is never sent. SENSITIVE data requires explicit event-level approval.

## Rules
1. Product analytics is not a substitute for audit logs.
2. Financial/domain ledgers remain authoritative.
3. User consent and jurisdictional rules are enforced before non-essential tracking.
4. Private communication and support content never enters product analytics.
5. AI prompts/responses and provider credentials never enter PostHog.
6. Adult-content analytics are minimized and category-based.
7. Deletion propagates to PostHog through the same durable deletion contract.
8. Analytics identifiers are pseudonymous and rotatable where required.

## Review gate
New event/property -> taxonomy entry -> data classification -> privacy review -> implementation -> automated payload test -> staging verification -> production.


## Adult Content Display Contract
- Canonical rule: `docs/ADULT_CONTENT_DISPLAY_CONTRACT.md`.
- Adult display is opt-in and defaults to `DISABLED`. Paid entitlement and age eligibility are necessary but insufficient.
- Unknown/stale/unavailable preference fails closed.
- All search, discovery, recommendation, API, MCP, notification, deep-link, cache, projection, vector, download and offline surfaces MUST enforce the same server-side decision.
