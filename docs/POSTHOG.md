# PostHog Integration Contract

## Status
V1 required product-analytics adapter. PostHog is not a source of truth for financial, entitlement, payment, moderation, privacy, or domain state.

## Architecture
`packages/analytics` exposes a provider-neutral ProductAnalytics interface. `packages/analytics/providers/posthog` provides the PostHog adapter. A Noop/Test adapter is mandatory.

Domain events and authoritative ledgers remain owned by StoryGalore. Product events may be forwarded asynchronously to PostHog.

## Allowed uses
- Product funnels, activation, retention and feature adoption
- Product experiments and feature-flag evaluation where explicitly approved
- UX/session replay subject to consent, privacy configuration and sensitive-route exclusions
- Web/product analytics

## Prohibited payloads
Never send passwords, API keys/BYOK secrets, session tokens, payment credentials, raw private messages, raw AI prompts/responses, raw support conversations, raw Appwrite documents, or unnecessary sensitive/personal data.

## Identity
Use a stable pseudonymous StoryGalore analytics identifier. Do not use email as the primary analytics identifier. Identity must respect consent and account deletion requirements.

## Consent
Non-essential PostHog tracking requires the configured consent/privacy policy. Essential security/operational telemetry is separate and must not be disguised as product analytics.

## Adult content
Use minimal categorical properties only when analytically necessary and legally/policy permitted. Do not transmit explicit content, thumbnails, prompts, titles, or descriptions merely to identify an adult interaction.

## Reliability
PostHog outages must not block user requests or authoritative domain transactions. Events are best-effort/asynchronous and may be dropped according to the documented telemetry policy.

## Deletion
A StoryGalore user deletion/DSAR must trigger deletion or anonymization of the corresponding PostHog identity/data according to the configured PostHog retention/deletion mechanism. The StoryGalore deletion workflow remains authoritative.

## Environments
Production and non-production projects/credentials are isolated. No production identifiers or secrets are used in staging/development.
