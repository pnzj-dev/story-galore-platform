# Dynamic Configuration & Hot Reload

## V1 requirement

StoryGalore product, policy, provider, feature-flag and operational configuration that is intended to be changed by Admins MUST be changeable at runtime without rebuilding, restarting, or redeploying the application.

This includes adult-content controls, AI/BYOAI switches, provider/model policy, user-hosted AI availability, provider maintenance/kill switches, discovery flags, ad controls, configurable rate/quotas, and other documented business policy.

Infrastructure configuration is different: code, dependencies, schema migrations, DNS, deployment topology, secrets-manager configuration, Cloudflare deployment configuration, and other infrastructure changes may require deployment or restart.

## Configuration service

Use a server-side, versioned Configuration Service backed by Appwrite TablesDB (or another explicitly approved dynamic configuration store). Do not encode business policy in environment variables or generated source code.

A configuration record contains:

- `configKey`
- `scope` (global/environment/workspace/provider/model where applicable)
- `value` (typed/validated JSON)
- `version`
- `status` (`ACTIVE`, `SUPERSEDED`, `DISABLED`)
- `effectiveAt`
- `changedBy`
- `reason`
- `createdAt`
- `checksum`

Every mutation creates a new immutable version. Rollback creates a new version pointing to a prior known-good value; history is never rewritten.

## Hot propagation

The target path is:

```text
Admin UI / Admin Agent
        |
        v
Configuration Service
        |
        +--> persist new version
        +--> audit event
        +--> publish config-changed event
                 |
        +--------+---------+---------+
        v                  v         v
   MCP/API cache      Go worker   Admin/read models
        |
        v
   immediate policy reads
```

Consumers may use a short-lived in-memory cache, but the cache MUST support version-aware invalidation. Do not require a process restart to observe a configuration version change.

Recommended behavior:

- event-driven invalidation as the primary path
- short TTL as a safety net
- atomic replacement of cached configuration
- version included in every policy evaluation
- fail-safe defaults for security-sensitive settings
- no stale cache beyond the documented maximum propagation window

## Policy evaluation

Every request that depends on dynamic policy reads the current effective configuration. The policy engine must expose the configuration version used for the decision.

Example:

```text
request
  -> load effective policy version 42
  -> evaluate
  -> decision = DENY
  -> audit(policyVersion=42)
```

## Cloudflare Workflows behavior

A policy change affects new operations immediately. Durable operations MUST re-check policy before any consequential external side effect.

For sensitive operations, policy changes can cause a queued operation to be denied before provider execution. For already-running operations, each workflow/activity documents whether it:

- `ALLOW_UNTIL_COMPLETION`
- `RECHECK_BEFORE_PROVIDER_CALL`
- `CANCEL_ON_POLICY_CHANGE`

The default for adult-content and other safety-sensitive provider execution is `RECHECK_BEFORE_PROVIDER_CALL`.

Cloudflare Workflows workflow history MUST NOT contain secrets or raw credentials.

## Admin controls

Dynamic configuration changes require:

- server-side RBAC
- validation against an allowlisted schema
- audit event
- reason for sensitive changes
- confirmation for emergency/destructive/high-impact changes
- optimistic concurrency/version check
- rollback support

Admin agents use the same configuration service and permissions as the Admin UI. A change made by an authorized Admin Agent must propagate without restarting other agents.

## Availability and failure modes

Configuration must fail closed for security-sensitive policies. If the dynamic store is unavailable and a cached configuration is still within its permitted freshness window, consumers may use the cached version. If freshness expires, sensitive operations must deny or enter a safe restricted state rather than silently assuming permissive defaults.

## Examples that MUST be hot-reloadable

- `adultCatalogEnabled`
- `adultGenerationEnabled`
- `adultDiscoveryEnabled`
- `adultRecommendationsEnabled`
- `adultSearchEnabled`
- `aiGenerationEnabled`
- `byokEnabled`
- `userHostedAIEnabled`
- provider/model enablement
- provider/model adult policy
- provider maintenance state
- AI rate/usage limits
- emergency provider kill switches
- feature flags
- ad campaign/configuration controls

## Acceptance tests

1. Toggle Adult Catalog OFF in Admin and verify public discovery rejects adult content without a deploy/restart.
2. Toggle BYOK OFF and verify new BYOK requests are denied without restarting MCP or Go workers.
3. Disable a provider and verify all new requests are denied within the documented propagation window.
4. Change a provider/model policy and verify the next policy evaluation uses the new version.
5. Change a policy while a Cloudflare Workflows workflow is queued and verify the pre-provider re-check applies the new policy.
6. Verify all policy decisions expose the configuration version used.
7. Verify rollback creates a new version and propagates without restart.
8. Verify an unauthorized agent cannot mutate configuration.
9. Verify stale configuration cannot silently bypass a safety-sensitive deny.
10. Verify no dynamic configuration secret is written to logs, MCP telemetry, or workflow history.
