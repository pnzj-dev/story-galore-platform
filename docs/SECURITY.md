# StoryGalore V1 Security Contract

## Principles

- least privilege
- deny by default
- server-side authorization
- centralized entitlements
- secrets only in managed secret storage
- auditable privileged operations
- minimal telemetry collection

## MCP

All agent-to-Appwrite tool invocations pass through the central Agent Gateway and Policy Engine, enforce the per-agent allowlist and tenant/resource scope, then use the registered Appwrite MCP connection. Appwrite permissions and domain authorization remain mandatory. Native Appwrite MCP tool discovery is not authorization. The unattended authentication mode must be verified before deployment.

Durable MCP operations must receive:
- authenticated actor context
- authorized tool/action
- cost/quota decision
- idempotency key

## Webhooks

Payment webhooks must:
- verify provider signatures/authentication
- reject replayed events
- persist raw event identifiers/metadata needed for reconciliation
- normalize events
- remain idempotent

Client redirects are never authoritative payment confirmation.

## Administrative access

Admin access requires MFA and role-based permissions. Sensitive operations require explicit authorization and produce audit records.

## Logging

Never log:
- credentials
- access/refresh tokens
- payment card data
- webhook secrets
- raw authorization headers
- unnecessary raw prompts/tool arguments
- sensitive personal data unless explicitly required and protected


## AI provider credentials and user-hosted endpoints

Cloud BYOK credentials and user-host endpoint authentication material are secrets. Store only references/metadata in ordinary application data and resolve secrets through the deployment's managed secret facility.

Never expose raw AI credentials through browser responses, MCP responses, audit records, analytics, logs, Cloudflare Workflows workflow arguments/history, crash reports or Appwrite ordinary records.

User-hosted endpoints are untrusted external infrastructure. Server-side connectors must enforce TLS where applicable, authentication, outbound allow/deny policy, SSRF protection, timeouts, response validation and tenant isolation. A user-hosted endpoint must never receive StoryGalore credentials or Appwrite service credentials.

BYOK does not bypass StoryGalore authorization, entitlement, moderation, age/content policy, rate limits, feature flags or audit.

## AI Policy Security

The AI Policy Engine is a mandatory server-side authorization boundary. MCP agents, frontend clients, provider adapters and user-hosted endpoints cannot bypass it.

User-hosted endpoints are untrusted external infrastructure. Apply SSRF protections, TLS/authentication, request/response validation, endpoint allow/deny controls, timeouts and tenant isolation.

Adult provider approval is independent from execution location. Unknown/expired provider-model policy is denied for adult generation. Global adult catalog/generation controls are server-side and audited.

## Runtime policy changes

Security-sensitive product policies must be dynamically versioned and hot-reloaded. See `docs/DYNAMIC_CONFIGURATION.md`. Configuration changes are RBAC-protected, validated, audited and fail closed when freshness guarantees expire.

## Defense in depth and agent security

Tenant isolation is enforced at identity, tenant context, capability authorization, domain authorization, Appwrite permissions, query/object ownership and output projection layers.

Agent authorization is capability-based. Sensitive agent credentials are short-lived or lease-scoped where supported. Break-glass access is temporary, explicitly authorized, reason-bound and fully audited.

The coding agent cannot directly access production secrets or perform unrestricted production destructive actions. Production changes pass through controlled review/approval workflows.

### Actor derivation at the api gateway (SEC-03)

The `api` gateway function derives the acting user from `x-appwrite-user-id` when present, otherwise from a caller-supplied session that is verified server-side, otherwise from the `actorId` field in the command envelope. Web SSR invokes `api` with a server-side API key (which does not populate `x-appwrite-user-id`), so it forwards the user session in the command envelope; the gateway verifies that session against the account endpoint and derives the actor from it.

Controls in place:

1. **Session-derived actor (implemented).** The web SSR forwards the session; the gateway resolves it to a user via `account.get()` and treats that user as authoritative over the body `actorId`. A forged body claim no longer wins when a session is present.
2. **Defense in depth (implemented).** When no session is present (system/agent invocations), the gateway rejects an `actorId` that is not an existing Appwrite user, so arbitrary/unknown identities cannot be claimed.
3. **Remaining limitation (documented).** System actors (Cloudflare workflows) and agents legitimately invoke `api` with a body `actorId` and no session; the gateway still trusts those claims after the existence check. Full closure would require separating the user invocation path from the system path. The Client SDK `createExecution` route (which populates `x-appwrite-user-id` natively) is an alternative but changes the function's `execute` permission surface.

## Search, recommendation and cache security

Search/vector similarity is not authorization. Candidate results must be filtered by authorization, entitlement, age/geography and publication/moderation policy before being returned.

Private/paid/adult cache entries require authorization-safe keys and signed/short-lived access as appropriate. Cached decisions must never cross users or tenants.

## Data classification

Use PUBLIC, INTERNAL, CONFIDENTIAL, SENSITIVE and SECRET classifications. Classification governs MCP exposure, logging, analytics, retention and support access.
