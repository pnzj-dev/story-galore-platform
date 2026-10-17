# Agent Slice 56 — V1 Social Core

## Objective
Implement StoryGalore's V1 social core using the deterministic contracts under `contracts/social/` and `contracts/state-machines/social.yaml`.

## Mandatory rules

- Do not create a second social graph outside the social contracts.
- Do not equate following with subscription or entitlement.
- Do not bypass Policy Engine, age, jurisdiction, moderation, publication, or adult policy.
- Do not use storage file IDs in social domain records; use MediaAsset IDs.
- All mutations require idempotency.
- Projections are rebuildable and never authorization sources.
- Realtime is not source of truth.
- Use stable cursor pagination for mutable feeds.
- Creator verification is presentation/identity state, not authorization.
- Block/mute/report behavior must be enforced server-side.
- Protected content must not leak through previews, OG metadata, notifications, collections, search, feeds, or share URLs.

## Implementation order

1. Persistence and indexes
2. State machines
3. Commands/queries
4. Authorization/policy integration
5. Event emission/outbox
6. Projection consumers
7. Notification integration
8. UI routes and components
9. MCP command mappings
10. E2E scenarios
11. Rebuild/recovery tests

## Required verification

Run `scripts/validate-social-v1.py` and all existing cross-domain/deterministic validators. A failure in any existing gate blocks completion of this slice.
