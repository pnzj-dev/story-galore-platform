# StoryGalore V15 — Architecture Hardening

V15 consolidates the final cross-cutting hardening layer before V1 implementation freeze.

## Control plane / data plane

### Control plane

The control plane owns policies and operational decisions:

- dynamic configuration and policy versions
- feature flags
- provider/model/capability registry
- agent registry and leases
- authorization capabilities
- entitlements and policy decisions
- operations/health state
- approval and break-glass access

### Data plane

The data plane executes normal product work:

- users and creators
- publications and media
- reading/library/comments
- AI/media jobs
- payments/subscriptions
- search/recommendations
- advertising
- notifications

Normal data-plane operations must not depend on the admin UI and must not route through the control plane unnecessarily. They consume signed/versioned policy decisions or current policy state through the Policy Engine.

## Defense-in-depth tenant isolation

Every tenant-scoped operation must enforce all applicable layers:

1. authenticated actor/agent identity
2. resolved tenant context
3. capability authorization
4. domain authorization
5. Appwrite permissions
6. query/object ownership constraints
7. output projection filtering

A failure or omission in one layer must not grant cross-tenant access.

## Capability-based agent authorization

Roles remain useful for administration, but agent authorization is capability-based. Examples:

- `creator.story.read`
- `creator.story.write`
- `creator.ai.generate`
- `creator.analytics.read`
- `support.user.read`
- `support.impersonate.scoped`
- `security.policy.read`
- `config.policy.activate`

Delegation never transfers capabilities implicitly.

## Agent leases and break-glass

Privileged agents use short-lived leases for sensitive operations. A lease is:

- scoped to an agent, tenant and capability set
- time-limited
- auditable
- revocable

Break-glass elevation requires human authorization where configured, explicit reason, narrow scope, short expiration and complete audit history. There is no permanent production super-agent credential.

## External side effects

StoryGalore uses at-least-once delivery with idempotent side effects rather than assuming universal exactly-once delivery.

Every externally visible mutation uses an idempotency key where supported. Provider adapters must persist enough state to prevent duplicate financial/publication/notification effects.

## Universal webhook ingestion

External webhooks follow:

```text
receive -> authenticate/signature verify -> raw immutable receipt -> inbox/dedupe -> normalize -> domain event -> processing
```

Raw receipts are retained only according to the applicable retention policy and never expose secrets in ordinary application views.

## Outbox / inbox / dead-letter

Domain transactions write an outbox record. Consumers use inbox deduplication. Failed messages use bounded retries and then a dead-letter state with safe replay tooling.

```text
READY -> PROCESSING -> RETRYING -> FAILED -> DEAD_LETTER -> RESOLVED
```

Operations staff must use controlled replay/retry actions rather than editing queue/database state directly.

## Event replay and schema evolution

Events are versioned. Search, recommendation, analytics and other projections are rebuildable from authoritative domain events or source records. Projection rebuilds must be isolated from production writes and have progress/checkpoint state.

## Immutable/tamper-evident audit

Sensitive audit records are append-only and tamper-evident where supported by the storage/operational design. Audit retention is policy-driven and does not permit ordinary mutation/deletion.

## Data classification

Minimum classifications:

- `PUBLIC`
- `INTERNAL`
- `CONFIDENTIAL`
- `SENSITIVE`
- `SECRET`

Classification controls logging, MCP exposure, analytics, retention, encryption and support access. Provider API keys and endpoint authentication are `SECRET`.

## Privacy-aware analytics

Operational events are transformed/minimized before analytics ingestion. Analytics must not become a copy of prompts, credentials, payment data or unnecessary personal data. Account deletion/anonymization propagates to analytics projections according to retention and legal requirements.

## Search/vector/recommendation authorization

Similarity, vector and recommendation retrieval is never itself an authorization decision.

```text
candidate retrieval -> authorization -> entitlement -> age/geo/content policy -> result
```

Private drafts, unpublished work, paid/adult restrictions and tenant boundaries are filtered before returning results.

## Cache authorization

Private/paid/adult content must use authorization-safe cache keys and short-lived signed access where appropriate. A cached authorization result for one user/tenant must never be reusable for another.

## Deletion propagation

Deletion uses a durable deletion workflow with expected targets and completion tracking:

```text
primary -> storage -> search -> vectors -> cache/CDN -> projections -> recommendations -> derivatives
```

Soft deletion and legal/financial retention exceptions are explicit. Permanent deletion is verifiable and idempotent.

## Backpressure and admission control

Expensive operations use admission control before queueing/execution:

```text
auth -> authorization -> entitlement -> policy -> quota -> budget -> capacity -> execute
```

Queue depth, provider limits and worker capacity can move capabilities into `BACKPRESSURE` or `ADMISSION_CONTROL` without taking unrelated features offline.

## Degraded modes

Dependency failures must degrade only affected capabilities where possible. Each capability exposes health/state and a user-safe explanation. Critical writes fail closed when correctness cannot be maintained.

## Coding-agent sandbox

The Continuous Development/Coding Agent is isolated from production secrets and unrestricted production mutation. Normal flow:

```text
change -> tests -> QA/security checks -> staging -> approval -> production
```

Production database, payment credentials, customer secrets and destructive operations require explicit privileged workflows.
