# StoryGalore V15 — UI Real-Scenario Matrix

This is the canonical contract for implementing and testing the StoryGalore UI against real backend behavior. It converts architecture scenarios into user-visible journeys.

## Status semantics

- `DESIGNED`: route, states and backend contract are specified.
- `IMPLEMENTED`: the real UI exists and is wired to the real service contract.
- `E2E_PASS`: the journey has passed against a real staging stack.
- `BLOCKED`: implementation or dependency is missing.

Documentation alone never upgrades a scenario to `IMPLEMENTED` or `E2E_PASS`.

## Shared UI state contract

Every data-bearing surface must explicitly handle:

`loading`, `empty`, `partial`, `success`, `saving`, `saved`, `offline`, `syncing`, `conflict`, `save_failed`, `processing`, `pending_review`, `restricted`, `age_required`, `subscription_required`, `permission_denied`, `unavailable`, `provider_unavailable`, `rate_limited`, `backpressure`, `retryable_error`, `permanent_error`, `removed`, `not_found`.

Critical mutations must expose a durable operation state when asynchronous work is involved. The UI must not infer success from navigation alone.

## Journey matrix

| ID | Persona | Journey | Critical UI states | Backend contract | Acceptance |
|---|---|---|---|---|---|
| UI-001 | Anonymous | Discovery -> detail -> preview -> signup | loading, empty, restricted, auth-required | search, content, preview policy, auth | Preview limits are server-enforced; no protected asset leaks |
| UI-002 | Free reader | Read -> ad -> page progress -> comment -> follow | ad-loading, ad-failed, saving, success, retry | reader, ads, reading state, comments, follows | Reading remains usable when ad provider fails |
| UI-003 | Paid reader | Subscribe -> confirmed entitlement -> premium read | checkout, pending, success, payment-failed, entitlement-pending | payment + webhook + entitlement | Redirect alone never grants access |
| UI-031 | Reader | Download allowed publication | download action -> authorization -> file ready -> open/share system file | entitlement + download policy | Protected source assets are never exposed |
| UI-032 | Reader | Download denied publication | action -> policy explanation -> subscribe/purchase/close | entitlement + download policy | UI cannot bypass server denial |
| UI-033 | Reader | Offline reading | add offline -> queued -> downloading -> ready -> offline reader -> reconnect sync | IndexedDB + entitlement | Offline cache is not a new entitlement |
| UI-034 | Reader | Export PDF/CBZ/EPUB | request -> processing -> ready -> download -> history | export service/Cloudflare Workflows when needed | Duplicate requests are idempotent |
| UI-035 | Reader | Revoked/expired download entitlement | cached item -> entitlement recheck -> restricted/new fetch denied | entitlement + policy | No new protected bytes after revocation |
| UI-004 | Returning reader | Resume on another device | syncing, conflict, success | reading-state sync | Latest authorized state is reconciled without data loss |
| UI-005 | Creator | Signup -> creator onboarding | validation, saving, saved, error | creator profile/workspace | No completed step is lost on refresh |
| UI-006 | Creator | Project -> universe -> story bible | autosave, offline, syncing, conflict | drafts/revisions | UI never reports Saved before server acceptance |
| UI-007 | Creator | Character/world/asset editing | autosave, upload, processing, recovery | draft revisions + storage | Browser crash can recover the latest accepted revision |
| UI-008 | Creator | Comic editor -> AI generation | queued, processing, progress, failed, cancelled | generation + credits/policy | AI never destructively overwrites draft |
| UI-009 | Creator | AI internal credits | reserve, processing, settle, refund | credit ledger | Retry cannot double-charge |
| UI-010 | Creator | BYOK provider setup | write-only secret, testing, invalid, disabled | provider registry + secret store | Raw key never appears in UI/API/logs |
| UI-011 | Creator | User-hosted AI setup | probing, capability mismatch, blocked SSRF, unavailable | outbound policy + capability negotiation | Endpoint cannot reach protected/internal addresses |
| UI-012 | Creator | Adult generation | age-required, policy-denied, allowed, provider-unavailable | Policy Engine + provider/model policy | Unknown/expired policy fails closed |
| UI-013 | Creator | Upload -> moderation -> publish | processing, review, rejected, approved, published | media + moderation + publication | Publication only follows authoritative state |
| UI-014 | Creator | Scheduled publication | scheduled, editing locked/allowed, published, failed | publication + workflow | Scheduled version references immutable approved revision |
| UI-015 | Reader | Adult content access | age gate, geo restriction, entitlement, success | adult policy + entitlement | Client cannot bypass server decision |
| UI-016 | Admin | Dashboard | loading, stale, partial, unavailable | analytics projections | Freshness is visible; accounting values are distinguished |
| UI-017 | Admin | Content moderation queue | claim, review, approve, reject, error | moderation + audit | Actions are scoped and audited |
| UI-018 | Admin | User/support impersonation | approval, active lease, expired lease, denied | capability + break-glass | Access expires and is auditable |
| UI-019 | Admin | Dynamic configuration | draft, simulation, confirmation, activated, rollback | config service + Policy Engine | Business policy changes without restart/redeploy |
| UI-020 | Admin | Adult controls | toggle, propagation, denied, restored | global policy | Catalog/generation/discovery controls are independent |
| UI-021 | Admin | Provider/model policy | verify, expired, disabled, fallback blocked | provider registry + policy | Fallback cannot cross policy boundary |
| UI-022 | Admin | Payments/reconciliation | pending, mismatch, retry, reconciled, DLQ | ledger + webhooks + reconciliation | Duplicate webhooks produce one financial effect |
| UI-023 | Admin | Advertising | draft, scheduled, active, capped, exhausted | campaigns + frequency caps + metrics | Paid users are excluded server-side |
| UI-024 | Admin | Analytics/MCP operations | live, delayed, failed, rate-limited | MCP telemetry | No secrets/prompts/payment data in telemetry |
| UI-025 | Operations | Cloudflare Workflows job monitor | queued, running, retrying, failed, cancelled, DLQ | workflow status/result/cancel | UI shows durable operation identity |
| UI-026 | Operations | Provider outage | degraded, unavailable, retry, recovery | provider health + policy | Unaffected platform features remain available |
| UI-027 | All | Offline/reconnect | offline, queued, syncing, conflict, recovered | IndexedDB + server revisions | No silent overwrite or data loss |
| UI-028 | All | Deletion | confirmation, processing, partial, completed, retry | deletion propagation | Search/cache/vector/derivatives eventually converge |
| UI-029 | All | Permission denial | denied, explanation, recovery path | capability + tenant auth | UI never exposes unauthorized object metadata |
| UI-030 | All | Not found/removed | not-found, removed, restricted | authoritative resource state | Deep links resolve to the correct safe state |

## Cross-journey requirements

1. Every mutation has a visible pending state when completion is asynchronous.
2. Every retryable failure has a safe retry action that reuses the same idempotency context where appropriate.
3. Every conflict has an explicit resolution path; no last-write-wins overwrite is hidden from the user.
4. Protected media is authorized before a signed/authorized URL is issued.
5. Search, vector and recommendation results are filtered by authorization and entitlement after candidate retrieval.
6. Adult policy changes take effect without an application restart and never weaken server-side checks.
7. Payment UI treats provider webhook/reconciliation state as authoritative.
8. AI UI shows billing mode (`StoryGalore Credits` vs `My API Key`) and does not imply that BYOK is platform-funded.
9. Long-running work exposes `operationId` and, where applicable, workflow status.
10. All critical user journeys are deep-linkable and recoverable after refresh.

| UI-031 | reader | comment-and-reply | Comments can be created/replied to with server-side content entitlement |
| UI-032 | reader | mention-and-notification | Mentions create authorized notifications |
| UI-033 | reader | message-request | Recipient message requests can be accepted/declined |
| UI-034 | reader | dm-realtime-and-offline | DM delivery survives reconnect without duplicate sends |
| UI-035 | creator | creator-messaging-settings | Creator recipient messaging policy is enforced server-side |
| UI-036 | all | block-and-report-community | Block/report changes community actions and moderation state |
| UI-037 | support-admin | restricted-private-message-access | Private message access requires explicit capability and audit |
| UI-038 | moderator | community-moderation-reconciliation | Moderated community state reconciles through Realtime/server |
