# V1 Testing Contract

Release gates:

- domain/unit tests
- Appwrite integration tests
- Cloudflare Workflows workflow/activity tests
- payment adapter contract tests
- webhook signature and replay tests
- entitlement/access-control tests
- moderation tests
- E2E/browser tests
- permission/security tests
- migration tests
- idempotency/retry tests
- backup/restore tests

Critical workflows must have tests proving that retries do not double-apply side effects.

Critical payment tests must prove that client redirects cannot create entitlements without authoritative provider confirmation.


## AI BYOK tests

Critical AI tests must prove:

- internal-credit execution reserves/settles/refunds credits correctly;
- BYOK execution does not consume StoryGalore AI credits for provider usage;
- billing mode cannot be changed by an unauthorized client after job creation;
- creator A cannot access creator B's credentials or endpoints;
- no raw credential appears in MCP responses, logs, analytics, audit records or Cloudflare Workflows workflow history;
- invalid/revoked credentials and unreachable user-hosted endpoints fail safely;
- user-hosted endpoint requests enforce SSRF/outbound policy and authentication;
- model capability discovery prevents incompatible generation requests;
- provider retries are idempotent where supported;
- moderation, entitlement and age/content controls apply equally to BYOK and StoryGalore-funded generations.

## AI Policy and BYOK acceptance tests

- `USER_HOSTED` never automatically grants adult permission.
- unknown/expired provider-model adult policy blocks adult generation.
- global adult catalog OFF hides/rejects public adult surfaces without deleting creator drafts.
- global adult generation OFF blocks generation while preserving existing work.
- adult discovery/search/recommendation switches operate independently.
- provider/model fallback never crosses adult-policy boundaries.
- admin emergency provider kill switch is server-side and audited.
- creator A cannot use creator B's provider/endpoint/credential.
- MCP agents cannot bypass policy decisions.
- raw BYOK credentials never appear in logs, analytics or Cloudflare Workflows history.

## V15 architecture-hardening tests

The implementation must include executable tests for the scenarios in `docs/SCENARIO_VALIDATION.md` and the release checklist in `docs/V1_FREEZE_GATE.md`.

Additional required suites:

- tenant-isolation fuzz/negative tests across agent, user and workspace identifiers;
- capability/lease expiration tests;
- break-glass authorization and automatic expiration;
- outbox/inbox duplicate delivery tests;
- dead-letter replay tests;
- webhook normalization and universal inbox tests;
- projection rebuild/replay tests;
- deletion propagation and retry tests;
- search/vector/recommendation post-retrieval authorization tests;
- cache-key and signed-URL isolation tests;
- stale configuration/freshness fail-closed tests;
- policy-change-before-provider-side-effect tests;
- backpressure/admission-control tests;
- coding-agent production sandbox tests;
- data-classification telemetry redaction tests.
