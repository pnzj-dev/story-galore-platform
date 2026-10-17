# V1 Operations, Security, Recovery & Cost Controls

## Operations Center

Admin V1 includes an Operations Center:

- platform health
- Cloudflare Workflows health
- Cloudflare Workflows health
- Appwrite operation state health
- Appwrite Function health
- worker/task-queue health
- Appwrite health
- payment-provider health
- failed jobs/workflows
- stuck workflows
- recent incidents
- recent audit events
- configured alerts

Operational actions must be permission-controlled and audited.

## Observability

Use structured logs, traces, metrics, and correlation IDs across:

`Agent runtime -> Agent Gateway/Policy Engine -> Appwrite MCP connection -> Appwrite; durable operations -> registered Execution Dispatcher -> Cloudflare Workflows -> approved activity -> Appwrite operation/function boundary.`

Every durable operation should expose:
- requestId
- traceId
- operationId
- workflowId
- actorId where permitted
- timestamps
- terminal status

Do not log secrets, tokens, payment credentials, raw prompts, or unnecessary personal data.

V1 must define health/readiness checks and measurable SLOs for MCP, payments, AI workflows, media processing, and critical APIs.

## Disaster recovery

Document:
- Appwrite backup strategy
- Storage backup/versioning strategy
- Cloudflare Workflows recovery expectations
- restore procedures
- RPO/RTO targets
- dependency recovery order

Run periodic restore tests. A backup is not considered valid until restoration has been tested.

## Security

V1 security requirements:
- security headers
- CSRF/session protections where applicable
- endpoint/tool/user/IP rate limits
- bot/abuse controls
- secret-manager-only production secrets
- webhook signature verification
- webhook replay protection
- encryption and key-rotation procedures
- mandatory admin MFA
- privileged-action confirmation where appropriate
- immutable/auditable administrative actions
- least-privilege Appwrite permissions
- tenant isolation

## MCP security

The external MCP ingress, central Agent Gateway, and Appwrite MCP connection collectively must enforce:
- authentication
- authorization per tool
- Appwrite entitlement checks
- tool allow/deny policy
- MCP-specific rate limits
- tenant isolation
- dangerous-operation confirmation
- audit logging
- workflow duration/cost limits
- client registration/revocation where required
- defenses against tool/prompt injection

MCP must never bypass the centralized entitlement engine.

## Workflow operations

Admin Operations must show:
- queued/running/completed/failed/cancelled workflows
- retry count
- workflow duration
- task queue
- worker availability
- stuck/overdue workflows
- safe retry
- cancellation
- manual-review state

Retry actions must respect workflow idempotency and must be audited.

## Feature flags

V1 feature flags support:
- admin management
- percentage rollout
- environment separation
- targeting
- audit history
- emergency kill switches
- server-side evaluation for security-sensitive decisions

## Content lifecycle

Model the full lifecycle:

`upload -> processing -> moderation -> approval -> publication -> update -> unpublish -> removal -> retention/deletion`

Content versions must be preserved sufficiently for rollback and audit.

AI-generated content must retain provenance and moderation state.

## Data deletion and retention

Define retention/deletion policies for:
- users
- creators
- assets
- AI generations
- comments
- analytics
- payment records
- audit records
- backups

Legal/financial retention requirements override ordinary deletion schedules where applicable. Deletion workflows must be durable and auditable.

## Financial/accounting readiness

Even before creator payouts launch, financial records should distinguish:
- gross revenue
- processor fees
- refunds
- chargebacks
- taxes where applicable
- platform revenue
- creator share/reserve

Do not reconstruct financial history from analytics events.

## Cost-control subsystem

Expensive operations use:

`request -> authorization -> quota/entitlement -> cost reservation -> execute -> actual cost -> settle/refund -> analytics`

Apply this to:
- AI generation
- AI regeneration
- media/video processing
- storage
- bandwidth where metered
- MCP usage where applicable
- Cloudflare Workflows workloads where costed
- payment processing

Reservations must be idempotent and recoverable if the operation fails.

## Testing

V1 release gates require:
- unit tests
- integration tests
- Appwrite integration tests
- Cloudflare Workflows workflow/activity tests
- payment adapter contract tests
- webhook signature/replay tests
- entitlement tests
- moderation tests
- MCP tool tests
- browser/E2E tests
- authorization/permission tests
- migration tests
- backup restore tests
- idempotency/retry tests

No critical V1 feature is accepted solely because its UI renders.
