> HISTORICAL / SUPERSEDED: This records an earlier MCP boundary. Current rule: autonomous agents access Appwrite through the central Agent Gateway, Policy Engine, and registered Appwrite MCP connection; Cloudflare MCP is external ingress only. See `contracts/integrations/appwrite-mcp-connection.yaml`.

> SUPERSEDED BY V19.5.9. This document is historical only; its runtime statements are not executable architecture.

# Architecture Simplification Loop — V19.5.9

## Goal
Preserve the complete V1 product capability set while minimizing independently operated runtimes, persistence authorities, protocol boundaries, and duplicated execution machinery.

## Loop results

### Loop 1 — Agent boundaries
Reduced 21 autonomous agents to 17.

Merged into capabilities rather than autonomous agents:
- Character → Story Producer
- World → Story Producer
- Creator Growth → Creator Business
- Cost Guardian → Data Analysis & Reporting

### Loop 2 — Durable execution
Removed the duplicate Appwrite durable-job executor.

V1 now has:
- Cloudflare Workflows = sole durable execution engine
- Appwrite TablesDB = authoritative domain/operation state
- Appwrite Functions = synchronous handlers, webhooks, schedules and integrations

Removed:
- execution_jobs infrastructure table
- lease/heartbeat/claim state machine
- Appwrite secondary job worker
- alternate durable executor path

Cloudflare outage handling is fail-closed/degraded rather than starting a second executor that could duplicate external side effects.

### Loop 3 — Runtime/toolchain
V19.5.9 supersedes the temporary Node.js/TypeScript standardization: all Appwrite Functions use Go.

Removed the Go Function template and Go-only backend toolchain.

Function boundaries were deliberately retained because their triggers, schedules, security scopes, scaling profiles, or external-provider responsibilities differ. Merging them would reduce deployment count but increase coupling and blast radius.

### Loop 4 — Legacy surface cleanup
Removed:
- retired Temporal runtime artifacts
- obsolete non-executable legacy agent directories
- duplicate backend MCP placeholder

The canonical application MCP boundary is the stateless Cloudflare MCP Worker.

## Boundaries intentionally retained

| Boundary | Reason |
|---|---|
| Appwrite TablesDB | transactional domain/operation state |
| Appwrite DocumentsDB | genuinely schemaless payloads |
| Appwrite VectorsDB | embedding/similarity-search capability |
| Appwrite Storage | binary/media origin |
| Appwrite Functions | Appwrite-native sync/event/schedule/integration boundary |
| Cloudflare Workers | edge/runtime execution |
| Cloudflare Agents | reasoning/stateful agent runtime |
| Cloudflare Workflows | durable execution |
| Cloudflare MCP Worker | external agent protocol boundary |
| Bunny | deterministic media failover |
| External provider adapters | payments/AI/specialized capabilities |
| Astro web application sites | distinct deployment/security surfaces |

Removing any retained boundary would either remove a required capability, weaken isolation, or create a more complex substitute.

## Stop condition

The simplification loop is COMPLETE for the current V1 scope.

A future simplification is permitted only if a concrete capability, security, scaling, or operational requirement is shown to remain satisfied and the change passes the same deterministic gates.

No implementation or production deployment is authorized by this document.
