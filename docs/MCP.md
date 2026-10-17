# Agent Tool Access: Appwrite MCP

StoryGalore uses the official Appwrite MCP connection as the agent-to-Appwrite tool interface, behind the Central Agent Gateway Appwrite Function and its in-process Policy Engine. No Cloudflare MCP server is part of the deployed StoryGalore application. Cloudflare MCP may be used separately by a developer's Coding Agent environment, but that tooling is outside this repository's application runtime and deployment graph.

## Request path

```text
Authorized StoryGalore agent
  -> Central Agent Gateway (Appwrite Function)
  -> in-process Policy Engine
  -> registered Appwrite MCP connection
  -> Appwrite platform
```

## Mandatory controls

- Derive agent identity from trusted runtime authentication and signed invocation context, never model-generated payload fields.
- Deny by default using per-agent tool allowlists, tenant/resource scope, capability policy, and risk/approval requirements.
- Validate registered tool IDs, input schemas, output schemas, provider catalog revision, and idempotency for mutations.
- Audit decisions and operations without logging secrets, raw prompts, or unnecessary personal data.
- Never permit direct agent SDK/HTTP access as a bypass around the gateway. Normal Astro and Go application code use only their separately registered native integration paths.
- The hosted Appwrite MCP endpoint is documented at https://appwrite.io/docs/tooling/ai/mcp-servers. Its unattended runtime identity/delegation model remains a hard implementation blocker until verified.

## Durable operations

Cloudflare Workflows is the sole V1 durable workflow engine for operations registered as durable. The gateway or an explicitly registered workflow activity starts approved work through the execution dispatcher and returns an operation handle. MCP requests must not synchronously perform long-running business operations.

## Implementation gate

Do not implement or deploy until the official Appwrite MCP authentication model, native tool catalog, exact tool mappings, resource scopes, idempotency behavior, audit path, and gateway security acceptance tests have been verified. Missing or ambiguous contracts mean BLOCK.
