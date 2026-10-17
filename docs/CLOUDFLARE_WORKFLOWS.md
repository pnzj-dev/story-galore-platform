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

## MCP integration

Cloudflare Workflows provides durable execution for registered long-running operations. Autonomous agent access to Appwrite is governed by the Central Agent Gateway, Policy Engine, and registered Appwrite MCP connection. Durable operations start through the approved dispatcher and return an operation handle rather than running synchronously inside an agent request. Any Appwrite access must use the registered Appwrite MCP path or an explicitly registered non-agent workflow activity path.

See `docs/MCP.md` for the tool boundary and operation-handle contract.
