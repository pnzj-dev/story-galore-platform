# Agent Slice 53 — Execution Resilience

## Goal

Implement the deterministic execution dispatcher with Cloudflare Workflows as the sole V1 durable executor for eligible DURABLE_JOB and DURABLE_WORKFLOW commands. Appwrite TablesDB remains authoritative for operation/domain state.

## Required implementation order

1. Read `contracts/execution/execution-dispatch.yaml`.
2. Read `contracts/execution/operation-persistence.yaml`.
3. Read `contracts/execution/operation-persistence.yaml`.
4. Read `contracts/tests/execution-resilience.scenarios.yaml`.
5. Implement the execution policy classifier.
6. Implement `ExecutionDispatcher` and executor adapters.
7. Implement the Appwrite `operations` resource using official Appwrite tooling; never invent resource IDs.
8. Implement the Appwrite Function workflow invocation and operation-state writer with operation idempotency validation.
9. Implement idempotency and safe failover classification.
10. Add telemetry without secrets or job payload contents.
11. Add tests for every scenario in the contract.
12. Run all existing V1/V17/V18 validators plus the execution-resilience validator.

## Hard prohibitions

- No secondary durable executor.
- No direct domain dependency on Cloudflare Workflows.
- No direct domain dependency on Appwrite Functions.
- No Cloudflare service may be used as the secondary job store.
- No automatic failover for unsafe external side effects.
- No job payload secrets in Appwrite job rows, logs, Cloudflare Workflows history, analytics, or MCP telemetry.
- No Cloudflare Workflows workflow for IMMEDIATE or ordinary DURABLE_JOB commands unless an explicit contract exception exists.
