# StoryGalore V1 Freeze Gate

V1 is releasable only when every applicable gate below is PASS **with executable or operational evidence**.

## Security / identity / authorization
- [ ] Auth, MFA, recovery and session security
- [ ] User/Creator/Workspace/Staff identity contract verified
- [ ] Defense-in-depth tenant isolation
- [ ] Capability-based agent authorization
- [ ] Agent leases and scoped break-glass
- [ ] Central Policy Engine
- [ ] Dynamic configuration hot reload + version propagation
- [ ] Policy simulator and decision log
- [ ] Provider/model/workflow policy verification
- [ ] User-hosted AI SSRF/authentication/isolation
- [ ] Secrets absent from clients, MCP, logs, analytics and workflow history

## Domain / persistence / workflow
- [ ] Domain contract registry complete
- [ ] API contract registry complete
- [ ] Event contract registry complete
- [ ] Appwrite schema/permission/index contract verified
- [ ] State machines validated
- [ ] Draft autosave/offline/recovery/conflict handling
- [ ] Universal outbox/inbox semantics
- [ ] Dead-letter and replay operations
- [ ] Deletion propagation verification
- [ ] Degraded modes and admission control
- [ ] Structured correlation across Agent Gateway/Appwrite MCP/Appwrite/Cloudflare Workflows/providers
- [ ] Appwrite MCP unattended authentication mode verified, least-privilege tested, and approved
- [ ] Per-agent Appwrite MCP allowlists and native tool mappings complete; direct Appwrite bypass tests pass

## AI / content / adult policy
- [ ] Adult catalog/generation/discovery controls
- [ ] Provider/model/API/product/region adult policy enforcement
- [ ] Internal credits reserve/settle/refund
- [ ] BYOK separation and provider billing
- [ ] Non-destructive AI provenance
- [ ] Moderation workflows and policy gates

## Payments / finance
- [ ] Plans and immutable plan versions
- [ ] Dedicated subscriptions table and lifecycle state machine
- [ ] Subscription renewal/cancellation/grace/expiration/plan-change flows
- [ ] Subscription/payment/entitlement separation
- [ ] Payment adapters and webhook ingestion
- [ ] Immutable webhook receipts + inbox dedupe
- [ ] Payment/entitlement separation
- [ ] Reconciliation and repair
- [ ] Financial invariants verified
- [ ] Refund/chargeback compensation
- [ ] No floating-point ledger arithmetic

## Privacy / operations
- [ ] Privacy/GDPR workflow and consent records
- [ ] Data classification, retention and deletion contracts
- [ ] DSAR/access/export/deletion verification
- [ ] Immutable/tamper-evident audit for sensitive operations
- [ ] Backup restore test
- [ ] Disaster recovery exercise with approved RPO/RTO
- [ ] Incident response runbook
- [ ] Migration/rollback verification
- [ ] Performance/cache/security validation

## Product / client readiness
- [ ] Accessibility and responsive E2E validation
- [ ] Real UI scenario validation suite
- [ ] Web/mobile/desktop client contract compatibility
- [ ] Download/offline entitlement checks
- [ ] Community/messaging authorization and privacy
- [ ] Support least-privilege projections
- [ ] Analytics dictionary, RBAC and rebuildability
- [ ] Advertising eligibility and measurement

## Coding-agent safety
- [ ] Coding-agent sandbox verified
- [ ] Official scaffolders/initializers used where available
- [ ] Production secrets isolated
- [ ] No unrestricted destructive production operations
- [ ] Agent changes follow tests -> QA/security -> staging -> approval -> production

## Release rule
No item may be marked PASS based only on documentation. A gate is PASS only when its implementation or operational verification artifact is attached to the release evidence set.

## Product Analytics / PostHog
- [ ] Provider-neutral analytics adapter exists
- [ ] PostHog production/staging isolation verified
- [ ] Event taxonomy versioned
- [ ] Payload allowlist and forbidden-property tests pass
- [ ] Consent/privacy boundary verified
- [ ] Adult-content analytics minimized
- [ ] PostHog failure cannot block domain transactions
- [ ] DSAR/deletion propagation verified
- [ ] No production analytics secrets committed


## Adult Content Display Contract
- Canonical rule: `docs/ADULT_CONTENT_DISPLAY_CONTRACT.md`.
- Adult display is opt-in and defaults to `DISABLED`. Paid entitlement and age eligibility are necessary but insufficient.
- Unknown/stale/unavailable preference fails closed.
- All search, discovery, recommendation, API, MCP, notification, deep-link, cache, projection, vector, download and offline surfaces MUST enforce the same server-side decision.

## Consent & Privacy

- [ ] Consent/preference classification is explicit and jurisdiction-aware.
- [ ] No pre-checked optional consent controls.
- [ ] Server-side enforcement exists for optional analytics, replay, personalized ads, marketing, and AI/model-improvement use.
- [ ] Consent versions and withdrawal timestamps are persisted.
- [ ] Withdrawal propagates to relevant processors/adapters.
- [ ] Adult-content display remains OFF by default and requires explicit enablement in addition to age/entitlement gates.

- Subscriptions & Plans: provider-independent billing strategies and renewal lifecycle

## Media Storage & Distribution

The media implementation must satisfy the Appwrite-origin / Cloudflare-distribution contract. Appwrite is authoritative for media files and metadata; Cloudflare provides distribution, caching and edge controls. Validate `contracts/domain/media-*.schema.yaml` and `contracts/state-machines/media.yaml` before considering media complete.

- [ ] Creator Studio contracts, editor operations, draft recovery and Studio E2E scenarios

## V17.7 Deterministic Implementation Pass
See `docs/DETERMINISTIC_IMPLEMENTATION_PASS.md` and `contracts/deterministic/` for canonical persistence, API, state, failure, and source-of-truth contracts across non-Studio domains.


### Cross-Domain Contract Integrity (V17.8)
- [ ] `pnpm validate:cross-domain` passes.
- [ ] No duplicate canonical state machines.
- [ ] All source-of-truth commands map to versioned events.
- [ ] All deterministic persistence resources are uniquely registered.
- [ ] MCP/UI adapters map to domain commands/queries.

Documentation alone never satisfies these checks.


### Cross-Domain Contract Integrity (V17.8)
- [ ] `pnpm validate:cross-domain` passes.
- [ ] No duplicate canonical state machines.
- [ ] All source-of-truth commands map to versioned events.
- [ ] All deterministic persistence resources are uniquely registered.
- [ ] MCP/UI adapters map to domain commands/queries.

Documentation alone never satisfies these checks.
