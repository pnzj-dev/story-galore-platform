# ADR 0014 — Secondary Media Distribution

## Status
Accepted for V18.0.

## Decision

Use Cloudflare as PRIMARY distribution and Bunny as SECONDARY distribution. Keep Appwrite Storage as the canonical origin. Make SECONDARY runtime-configurable and admin-disableable.

## Consequences

- Distribution failures can be isolated from origin persistence.
- The platform can disable SECONDARY without deployment.
- Business authorization remains provider-neutral.
- A second CDN introduces operational complexity, health monitoring, and cost.
- Provider credentials and CDN APIs remain infrastructure concerns behind adapters.

## Rejected

- DNS-only failover: insufficient for authorization-aware, regional selection.
- Public Appwrite fallback: authorization and origin-protection risk.
- Cloudflare R2 as a second canonical origin: violates the Appwrite-origin decision.
- Making Bunny mandatory: unnecessary dependency and operational cost when SECONDARY is disabled.
