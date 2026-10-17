# PostHog provider adapter — implementation target

**Status: specified, not implemented.** This directory documents the intended provider boundary and is not a runnable adapter.

## Required behavior

- Implement the provider-neutral interface defined by `packages/analytics/README.md`.
- Enforce consent and privacy policy before capture.
- Use an explicit event/property allowlist; never send secrets, raw prompts, private messages, payment credentials, or raw domain records.
- Deliver asynchronously so provider outages cannot block authoritative operations.
- Support deletion/anonymization flows and environment isolation.
- Pin the latest stable compatible SDK only after official-source verification; register exact versions and lockfile evidence in `contracts/architecture/technology-version-lock.yaml`.
- Provide deterministic tests for consent, payload rejection, outages, deletion, and environment isolation.

No PostHog credentials or production project identifiers belong in this directory.
