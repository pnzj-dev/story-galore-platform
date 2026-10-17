# Repository Audit — V19.5.22

## Change scope

Added deterministic contracts for the shared StoryGalore Notification Service. This is a repository specification update only; no production implementation or deployment is claimed.

## Before

- Notification command/query, event, and function contracts existed but did not fully define the end-to-end notification architecture.
- Desired TablesDB schema omitted the three notification resources even though logical resource registries referenced them.
- The notification state machine combined delivery and read states, allowing ambiguity between provider delivery and user interaction.
- Delivery provider verification, deep-link safety, user-scoped realtime, privacy, retry limits, and UI/operations acceptance were not collected in one canonical document.
- Notification Appwrite Function was classified as a durable job worker, conflicting with the rule that Cloudflare Workflows is the only durable workflow engine.

## After

- Added `docs/NOTIFICATION_SYSTEM.md` and `contracts/deterministic/notifications/delivery-policy.yaml`.
- Added desired TablesDB resources: `notifications`, `notification_preferences`, and `notification_delivery_attempts`.
- Separated inbox lifecycle/read timestamps from per-channel delivery-attempt state.
- Reclassified the Appwrite notification Function as a request handler that persists the inbox record and starts registered durable delivery workflows.
- Added 14 contract scenarios covering idempotency, provider outages, read/delivery independence, cross-user isolation, deep links, block/mute policy, retries, provider receipts, realtime scope, agent bypass, mandatory policy, and staff authorization.
- Added `scripts/validate-notification-system.mjs` and `pnpm validate:notifications`.
- Updated architecture and documentation source-of-truth pointers.

## Validation performed

- `node scripts/validate-notification-system.mjs` — PASS
- `node scripts/validate-appwrite-functions.mjs` — PASS (28 function contracts)
- `node scripts/validate-repository-coherence.mjs` — PASS
- `node scripts/validate-doc-consistency.mjs` — PASS
- `python3 scripts/validate-contract-syntax.py` — PASS (867 YAML files)
- `node scripts/validate-determinism.mjs` — PASS
- `node scripts/validate-cross-domain.mjs` — PASS
- `node scripts/validate-ui-contract.mjs` — PASS
- `node scripts/validate-implementation-spec.mjs` — PASS
- `node scripts/validate-authorization-contracts.mjs` — PASS

## Remaining blockers

- Runtime implementation is not present/verified by this change.
- Appwrite resource IDs, concrete schema/index/permission generation, and provisioning remain pending official tooling.
- Provider-specific contracts, consent/unsubscribe policy, jurisdiction rules, quiet-hours/time-zone defaults, retry limits, delivery receipt semantics, and retention policy require approval/verification before external channel enablement.
- Integration and failure-injection tests against configured providers and Appwrite Realtime remain required.
- Existing technology resolution, exact package-manager pin, and lockfile bootstrap blockers remain unchanged.
