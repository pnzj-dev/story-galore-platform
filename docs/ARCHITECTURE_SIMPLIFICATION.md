# V19.5.5 — Architecture Simplification / Runtime Profiles

StoryGalore keeps strong correctness and security guarantees without requiring every mechanism on every feature.

## Runtime profiles

### CORE
Always available and normally required:
- Appwrite
- domain services
- shared UI system
- authentication/authorization
- Policy Engine
- critical domain state machines
- audit
- tests

### WORKFLOW
Activate only for long-running, retryable, durable or externally reconciled work:
- Cloudflare Workflows
- Outbox/Inbox
- DLQ
- reconciliation
- bulk jobs
- long-running media/AI/moderation operations

### EXTENSION
Activate only when the product capability is enabled:
- AI providers and BYOK
- additional payment adapters
- advertising
- vector/recommendation search
- additional media types
- additional MCP tools
- specialized agents

## Complexity budget
A feature MUST NOT introduce a new service, database, state machine, workflow, agent, or external dependency without a written justification in its task contract or ADR.

Prefer an existing package, service, state machine, workflow, or component when it already satisfies the requirement.

## Selection rules
- Simple synchronous CRUD: CORE only.
- Critical business state: CORE state machine.
- Long-running/retryable work: CORE + WORKFLOW.
- Optional product capability: CORE + relevant EXTENSION.
- External side effect: Policy check + idempotency; durable workflow only when duration/retry semantics require it.

Cloudflare Workflows is never the source of truth for business state. MCP is an agent interface, not the primary application backend.

## Principle
> Use the simplest architecture that satisfies correctness, security, durability, observability, and scale requirements.
