> **HISTORICAL / SUPERSEDED:** This ADR records the pre-V19.5.4 secondary Appwrite durable-execution proposal. The current V1 decision is Cloudflare Workflows as the sole durable workflow engine. Do not implement this ADR's independent secondary executor.

# ADR 0015 — Resilient Execution Tiers

## Decision

StoryGalore uses three explicit execution classes:

1. IMMEDIATE — normal application execution.
2. DURABLE_JOB — Cloudflare Workflows sole V1 durable executor.
3. DURABLE_WORKFLOW — Cloudflare Workflows for complex long-running orchestration.

## Rationale

Cloudflare is a valuable primary platform but must not be the only durability path. The Appwrite secondary path is operationally independent of Cloudflare and avoids introducing a second persistent worker fleet. Cloudflare Workflows remains available where its workflow semantics justify its cost and operational complexity.

## Consequences

- Every asynchronous command requires explicit execution classification.
- Domain code depends on Execution Dispatcher contracts, not executor SDKs.
- Appwrite TablesDB is authoritative for secondary DURABLE_JOB state.
- Appwrite Functions are stateless executors.
- Cloudflare Workflows remains authoritative only for workflow execution state; domain state remains in domain persistence.
- Automatic failover is prohibited for unsafe external side effects.
