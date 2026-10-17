# StoryGalore V15 — Real-Scenario Architecture Validation

This document records architecture-level scenario validation performed before V1 freeze. It validates invariants and required behavior; it is not a substitute for implementation E2E tests.

## Validation rule

A scenario is considered architecturally valid only when the result can be reached without a UI-only security assumption, without bypassing the Policy Engine, and without requiring an avoidable restart/redeploy for dynamic business policy.

## Scenario matrix

| Scenario | Expected behavior | Required invariants |
|---|---|---|
| Admin disables adult catalog | New public adult discovery/search/read access is denied; drafts are preserved | server-side policy, hot reload, audit |
| Admin re-enables adult catalog | Eligible users regain access after policy propagation | versioned config, entitlement + age + geo still enforced |
| Admin disables adult generation | New adult generations denied; existing drafts preserved | policy decision, no deletion |
| Creator uses internal AI credits | reserve -> execute -> settle/refund | idempotency, credit ledger |
| Creator uses BYOK | provider usage billed by provider; StoryGalore AI credits not consumed | credential isolation, policy parity |
| Creator A tries Creator B endpoint | denied | tenant isolation at multiple layers |
| User-hosted endpoint points at internal address | denied | SSRF/outbound policy |
| User-hosted model is unknown for adult use | adult generation denied | `REQUIRES_VERIFICATION` fails closed |
| Approved adult model becomes expired | future adult generation denied pending review | `reviewAfter`, hot policy |
| Provider goes down | affected AI capability degraded; reading/discovery remain available | degraded mode |
| Cloudflare Workflows is unavailable | durable work unavailable; normal reads remain available | dependency isolation |
| Payment webhook arrives twice | one ledger effect | inbox/dedupe/idempotency |
| Payment redirect says success but webhook absent | no entitlement | webhook authoritative |
| Creator publishes while retry occurs | one published version | idempotent publication |
| User deletes account | deletion workflow propagates to approved targets; retention exceptions preserved | durable deletion |
| Search index is corrupted | rebuild from authoritative source/events | projection rebuildability |
| Recommendation contains inaccessible comic | result filtered before response | auth after candidate retrieval |
| Admin changes provider policy while job is queued | job rechecks policy before provider call | hot config + Cloudflare Workflows recheck |
| Config store temporarily unavailable | fresh cached policy may be used within max freshness; after expiry sensitive actions fail closed | fail-closed freshness |
| Admin changes global setting | all agents/services observe new version without restart | event invalidation + versioned cache |
| Support impersonates user | scoped, temporary, audited access only | lease/capability/break-glass rules |
| Coding agent attempts production destructive action | blocked without explicit privileged workflow | agent sandbox |
| Dead-letter AI job | inspect/retry/replay through operations tooling | controlled DLQ handling |
| Provider fallback is required | only policy-compatible candidates may be selected | no policy-boundary crossing |
| Adult catalog disabled while adult creator edits draft | editing remains possible if creator policy permits; public exposure remains blocked | catalog vs generation separation |
| Cache serves paid/adult content | authorization-safe key/signature prevents cross-user leakage | cache isolation |
| Analytics event contains prompt/key | event rejected/sanitized | privacy minimization |

## Failure-injection checks

The implementation test suite MUST add failure injection for:

- Appwrite timeout
- Appwrite partial failure
- Cloudflare Workflows unavailable
- provider timeout
- provider 429
- provider 5xx
- webhook replay
- stale configuration cache
- configuration event loss
- duplicate outbox delivery
- duplicate inbox delivery
- storage failure during upload
- search projection failure
- recommendation projection failure
- deletion target failure
- worker crash after external side effect

## Acceptance criteria

All scenarios above must have an executable implementation test before production V1 sign-off. Any scenario marked architecturally valid but lacking an implementation test is a release blocker, not an assumed pass.
