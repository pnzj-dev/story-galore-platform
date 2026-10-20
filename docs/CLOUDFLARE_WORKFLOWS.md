# Cloudflare Workflows Architecture

StoryGalore V1 separates application services from durable workflow orchestration.

```text
Astro web application
       |
     Appwrite
       |
 WorkflowRunner
       |
Cloudflare Workflows
       |
Cloudflare Workers / registered provider adapters
```

Appwrite remains responsible for Auth, TablesDB/DocumentsDB, Storage, Functions, Messaging, Realtime, VectorsDB, permissions, and API-facing application operations.

Cloudflare Workflows is the registered V1 durable execution engine for eligible long-running orchestration, including AI generation, media processing, moderation, payment reconciliation, subscription lifecycle repair, and selected analytics aggregation. Simple CRUD and user-facing request/response operations stay on the Appwrite path.

The `WorkflowRunner` boundary remains provider-neutral. Domain state is authoritative in StoryGalore persistence; workflow execution state is not a substitute for domain state. Workflow inputs and state contain references to large media rather than media bytes, and never contain raw credentials or secrets.

Local development and automated tests MUST use the supported Cloudflare local/testing path for registered workflows. Production execution uses the Cloudflare account/environment declared by the deployment contracts. No separate workflow-worker fleet is required.

## Scheduling (cron)

The Cloudflare-native `schedules` cron is gated to the Workers Paid plan
(`workflows.api.error.workflow.cron_requires_paid_plan`), so it is not used in
V1. Periodic workflow triggers are driven by the Appwrite `api` function's cron
schedule instead: on the schedule trigger the gateway POSTs to each workflow
Worker's HTTP trigger endpoint (guarded by a shared secret). Each Worker's
`fetch` handler creates the workflow instance through `ctx.exports`.

```
Appwrite Functions cron (*/5 * * * *)
       |  POST <workflow-worker>.workers.dev  (Authorization: Bearer <secret>)
Worker fetch handler -> ctx.exports.<Workflow>.create({})
```

- `generation` and `outbox-delivery` are triggered every schedule firing.
- `prompt-redaction` is triggered once daily (first firing of each UTC day).

The trigger requires `CF_TRIGGER_SECRET` plus the per-workflow Worker URLs
(`CF_GENERATION_URL`, `CF_OUTBOX_URL`, `CF_REDACTION_URL`) as Appwrite function
secrets; the same `TRIGGER_SECRET` value is a `plain_text` binding on each
workflow Worker. Without them the gateway logs a skip and continues; the trigger
is a no-op (idempotent sweeps), so missing credentials degrade to "no scheduled
trigger" rather than a failure.

The HTTP-trigger path avoids a Cloudflare API token (the OAuth-scoped MCP
connection cannot mint tokens), so it is the V1 default.

Do not put a `schedules` array back into the workflow `wrangler.jsonc` unless
the Workers plan is upgraded.

## MCP integration

Cloudflare Workflows provides durable execution for registered long-running operations. Autonomous agent access to Appwrite is governed by the Central Agent Gateway, Policy Engine, and registered Appwrite MCP connection. Durable operations start through the approved dispatcher and return an operation handle rather than running synchronously inside an agent request. Any Appwrite access must use the registered Appwrite MCP path or an explicitly registered non-agent workflow activity path.

See `docs/MCP.md` for the tool boundary and operation-handle contract.
