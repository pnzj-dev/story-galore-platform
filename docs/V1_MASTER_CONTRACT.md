# StoryGalore V1 Master Contract

**Status:** FROZEN CONTRACT — V16.0
**Scope:** contractualizes the already-approved V1 architecture; introduces no new product capability.

## 1. Normative language
MUST/SHALL = mandatory. SHOULD = default unless a documented exception exists. MAY = optional.

## 2. Source-of-truth hierarchy
1. Financial/domain ledgers and authoritative domain records.
2. Policy/configuration versions and audit records.
3. Appwrite persistence and permissions for their declared domains.
4. Durable workflow state for execution, never business truth.
5. Search, vectors, recommendations, analytics, realtime and caches are rebuildable projections.

## 3. Identity model
- **User:** authenticated human account.
- **Creator:** User with creator capabilities and creator-owned tenant context.
- **Workspace:** explicit collaboration/tenant boundary; membership is separate from product plan.
- **Staff:** User granted staff capabilities through RBAC/capability policy; staff is never implied by Appwrite team membership alone.
- **Agent:** non-human execution identity with a short-lived scoped lease and explicit capabilities.

A request MUST carry actor identity, tenant/workspace context where applicable, capability context and correlation identifiers. Server authorization is authoritative.

## 4. Contract boundaries
- Appwrite owns identity, persistence, storage, realtime and functions according to domain contracts.
- Autonomous agents access Appwrite only through the central Agent Gateway, Policy Engine, and registered Appwrite MCP connection. No Cloudflare MCP server is part of the StoryGalore application runtime. The verified unattended Appwrite MCP authentication model is a hard implementation gate.
- Cloudflare Workflows owns durable execution only.
- Go workers own Cloudflare Workflows workflow activities and external side effects only; Appwrite Functions execute Appwrite operation state jobs.
- Clients never receive provider secrets, internal credentials or unrestricted storage objects.

## 5. Mutation contract
Every externally visible mutation MUST have authorization, policy evaluation where applicable, validation, idempotency, audit classification and correlation. Durable side effects MUST be retry-safe.

## 6. Error contract
All APIs and MCP tools return stable machine-readable error codes plus safe human-readable messages. Secrets, credentials, payment instruments, raw private messages and unnecessary personal data MUST NOT appear in errors.

## 7. Deletion contract
Deletion is an asynchronous propagation concern. The authoritative deletion record is created first; storage, search, vectors, caches/CDN, projections, recommendations and derivatives MUST converge to the deleted state. A deletion operation has an operationId and observable status.

## 8. Release contract
V1 is releasable only when the Freeze Gate, Master Definition of Done, executable validators and required operational evidence are all PASS. Documentation alone never constitutes PASS.

## 9. Change control after freeze
Any change to a frozen contract requires a versioned ADR, impact analysis, contract test update, migration/rollback assessment and explicit release approval. Backward-compatible additive changes MAY remain in the same major contract version when documented.

## Product Analytics Provider Contract

PostHog is a V1-supported product-analytics adapter. It is not authoritative for financial, payment, entitlement, moderation, privacy, audit, or domain state. Product analytics must use the provider-neutral `packages/analytics` contract, with PostHog and Noop/Test adapters. PostHog ingestion is non-blocking and privacy/consent gated. Forbidden payload classes and deletion propagation are defined by `docs/ANALYTICS_PRIVACY_BOUNDARY.md` and `docs/POSTHOG.md`.


## Adult Content Display Contract
- Canonical rule: `docs/ADULT_CONTENT_DISPLAY_CONTRACT.md`.
- Adult display is opt-in and defaults to `DISABLED`. Paid entitlement and age eligibility are necessary but insufficient.
- Unknown/stale/unavailable preference fails closed.
- All search, discovery, recommendation, API, MCP, notification, deep-link, cache, projection, vector, download and offline surfaces MUST enforce the same server-side decision.

## Consent & Privacy Contract — V1.3

The authoritative consent/privacy contract is `docs/CONSENT_PRIVACY_CONTRACT.md`. Optional processing is opt-in where required, privacy preferences are server-enforced, withdrawal is propagated, and adult-content display remains a distinct explicit product preference.


V18.7 addition: StoryGalore-managed AI credits are explicitly isolated from BYOK/user-hosted execution; media provider adapters include a dynamic Higgsfield catalog family.
