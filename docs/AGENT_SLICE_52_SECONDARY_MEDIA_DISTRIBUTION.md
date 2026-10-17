# Agent Slice 52 — Secondary Media Distribution

## Objective
Implement deterministic, authorization-safe media distribution with Cloudflare as PRIMARY and Bunny as SECONDARY, with runtime admin control to disable SECONDARY.

## Preconditions
- V17.9/V18.0 media upload and Appwrite-origin contracts pass.
- Cross-domain compatibility validation passes.
- Appwrite Storage remains canonical origin.

## Required implementation boundaries
1. `MediaDistributionService` owns provider selection.
2. `CloudflareDistributionAdapter` implements PRIMARY delivery.
3. `BunnyDistributionAdapter` implements SECONDARY delivery.
4. Adapters accept already-authorized delivery requests; they do not perform business entitlement or age decisions.
5. `media_distribution_config` is the authoritative configuration resource.
6. `media_distribution_health` is an operational projection only.
7. Admin mutations enter through `media_distribution_config_update`.
8. Admin capability required: `operations.media_distribution.configure`.
9. Mutations require idempotency key, expected revision, reason, audit identity, and normal approval policy.
10. `secondaryEnabled=false` makes effective mode `PRIMARY_ONLY`.
11. No code path may expose a public Appwrite URL as a distributor fallback.
12. Protected delivery authorization must be bound to the selected distributor.

## Required interfaces

```ts
interface MediaDistributionService {
  getConfig(ctx: RequestContext): Promise<MediaDistributionConfig>;
  getStatus(ctx: RequestContext): Promise<MediaDistributionStatus>;
  updateConfig(input: UpdateMediaDistributionConfig): Promise<MediaDistributionConfig>;
  authorizeAndSelect(input: MediaDeliveryRequest): Promise<AuthorizedDistributionSelection>;
}

interface DistributionAdapter {
  readonly provider: 'cloudflare' | 'bunny';
  probe(input: DistributionProbeRequest): Promise<DistributionProbeResult>;
  createAuthorizedDelivery(input: AuthorizedMediaDeliveryRequest): Promise<AuthorizedDelivery>; 
}
```

Do not add provider-specific methods to the domain service. Provider-specific APIs belong inside adapters.

## Selection algorithm

1. Load the current configuration revision.
2. Evaluate authentication and all applicable policy/entitlement/age/jurisdiction/moderation checks.
3. Reject if authorization fails.
4. Determine region from trusted request context.
5. Read health/circuit state for the region.
6. If mode is `PRIMARY_ONLY`, select Cloudflare only.
7. If mode is `SECONDARY_ONLY`, require SECONDARY enabled and healthy; otherwise degrade.
8. If mode is `AUTOMATIC_FAILOVER`, prefer Cloudflare while its circuit is `CLOSED`.
9. If Cloudflare circuit is `OPEN` or threshold failure is reached, select Bunny only if `secondaryEnabled=true` and its circuit is eligible.
10. Issue distributor-bound delivery authorization.
11. Emit telemetry without secrets.
12. Never retry an authorization failure as a distributor failure.

## Admin disable behavior

When an authorized admin sets `secondaryEnabled=false`:

- increment configuration revision;
- persist the change atomically;
- emit `media.distribution_config_updated.v1`;
- invalidate configuration caches;
- prevent new SECONDARY selections immediately after propagation;
- force effective mode to `PRIMARY_ONLY`;
- do not revoke unrelated media entitlements;
- do not expose Appwrite origin URLs;
- preserve bounded behavior for already-issued delivery tokens according to their existing expiry/revocation rules.

## Re-enable behavior

When SECONDARY is enabled again:

- persist a new configuration revision;
- run/require a successful health probe before selection;
- restore eligibility only after probe success;
- do not silently switch all regions to SECONDARY.

## Required tests

See `contracts/tests/media-distribution.scenarios.yaml`. Every scenario is mandatory before the slice is PASS.

## Acceptance gate

```text
pnpm validate:media-distribution
pnpm validate:cross-domain
pnpm validate:deterministic-contracts
pnpm validate:admin-control
pnpm validate:admin-rbac
pnpm validate:v1-contract
```

A coding agent MUST stop on any failure, contract conflict, security ambiguity, missing provider capability, or undocumented migration.
