# StoryGalore V1 — Human + Agent Administration Control Matrix

## Purpose

Every V1 capability must be operationally manageable by an authorized human through the Admin route surface and/or by an authorized operational agent through MCP. A capability is not considered administrable merely because the underlying API exists.

For every row below, the implementation must provide:
- Human admin surface: page, queue, settings, or operational action.
- Agent surface: one or more scoped MCP operations.
- Authorization: RBAC/capability + target/tenant checks.
- Audit: sensitive mutations produce immutable audit records.
- State visibility: current state and relevant failure/retry state are inspectable.
- No privilege bypass: MCP never grants authority unavailable to the human role/policy.

## Matrix

| V1 area | Human admin surface | Agent surface | Operational actions |
|---|---|---|---|
| Auth / sessions / MFA | Users → Security | `admin_user_*`, `support_*` | inspect, restrict, revoke sessions, security events, step-up actions |
| Users / creators | Users, Creators | `admin_user_*`, `admin_creator_*` | inspect, restrict, suspend, restore, labels, ownership-safe changes |
| Content / publications | Content | `admin_content_*` | inspect, hide, unhide, remove, restore, lifecycle state |
| Series / episodes / pages | Content → Publications | `admin_publication_*` | inspect, lifecycle operations, processing status |
| Comments / replies / reactions | Community → Comments | `admin_comment_*`, `community_*` | queue, inspect context, moderate, restore, report handling |
| Messaging / DM | Community → Messaging | `admin_messaging_*` | reports, abuse cases, policy/settings, restricted case access; never unrestricted inbox access |
| Blocks / sanctions | Community → Safety | `admin_safety_*` | inspect, impose/remove scoped sanctions, appeals |
| Reports | Moderation → Reports | `moderation_report_*` | triage, assign, resolve, escalate |
| Moderation | Moderation → Queue | `moderation_*` | classify, approve, reject, hide, remove, restore |
| Adult policy | Policies → Adult | `policy_*`, `config_*` | catalog/generation/discovery controls, policy versions, rollback |
| Provider/model policy | AI → Provider Policies | `ai_provider_*`, `policy_*` | verify, approve/restrict, expire, review |
| AI providers / BYOK | AI → Providers | `ai_provider_*` | health, enable/disable, policy-safe configuration, usage; never reveal secrets |
| AI generations | AI → Generations | `ai_generation_*`, `workflow_*` | inspect, retry/cancel where authorized, policy state, operation status |
| AI credits / cost | Finance → AI | `finance_*`, `aiops_*` | reservations, settlement, refunds/adjustments, cost controls |
| User-hosted AI | AI → User Hosted | `ai_provider_*`, `security_*` | endpoint policy, health, SSRF controls, capability status |
| Drafts / publication lifecycle | Content → Drafts | `creator_*`, `admin_content_*` | inspect, recover, publication repair; never silently overwrite creator drafts |
| Media / uploads / processing | Operations → Media | `ops_media_*`, `workflow_*` | inspect, retry, cancel, repair, storage status |
| Media distribution | Operations → Media Distribution | `operations.media_distribution.*` | inspect health, enable/disable SECONDARY, select effective mode, inspect failover state; never bypass authorization |
| Downloads / offline / exports | Content → Downloads | `admin_download_*`, `workflow_*` | policy, abuse/rate limits, export status, revoke/repair |
| Library / follows / reading progress | Users → Engagement | `admin_engagement_*`, `user_*` | inspect aggregates, privacy-safe repair; no arbitrary user-state mutation without capability |
| Search | Discovery → Search | `discovery_search_*` | index health, rebuild, inspect, authorization diagnostics |
| Recommendations | Discovery → Recommendations | `discovery_recommendation_*` | model/index health, rebuild, policy diagnostics |
| Payments | Finance → Payments | `finance_payment_*` | ledger, webhook receipts, provider health, refunds where authorized |
| Subscriptions / entitlements | Finance → Subscriptions | `finance_subscription_*`, `admin_entitlement_*` | inspect, repair, revoke/grant only through approved operation |
| Reconciliation | Finance → Reconciliation | `finance_reconciliation_*`, `workflow_*` | run, inspect, retry, resolve exceptions |
| Advertising | Monetization → Ads | `admin_ad_*`, `analytics_*` | inventory, campaigns, creatives, placements, budgets, schedules, reporting |
| Notifications | Operations → Notifications | `admin_notification_*` | inspect delivery health, templates/settings, retry failed deliveries |
| Analytics | Analytics | `analytics_*` | dashboards, aggregates, event health, rebuilds |
| Consumer economics | Monetization → Consumer Economics | `economics.consumer.*`, `economics.consumption.*`, `economics.unit-economics.*`, `economics.anomaly.*` | inspect plans, consumption, infrastructure cost, contribution margin, fair-use anomalies; policy mutations remain approval-gated |

| Audit | Security → Audit | `audit_*` | search, export where authorized, integrity verification |
| Dynamic configuration | Settings → Configuration | `config_*`, `policy_*` | activate, version, rollback, simulate, inspect propagation |
| Feature flags | Settings → Features | `config_*` | enable/disable/target/rollback with audit |
| Operations / workflows | Operations Center | `workflow_*`, `ops_*` | inspect, retry, cancel, DLQ, replay, degraded modes |
| MCP operations | Operations → MCP | `ops_mcp_*`, `analytics_*` | tool health, clients, rate limits, latency/errors, correlation |
| Security / abuse | Security → Abuse | `security_*` | incidents, sanctions, rate limits, SSRF/security diagnostics |
| Storage / deletion | Operations → Data Lifecycle | `ops_storage_*` | deletion propagation, retention, restore/repair where authorized |
| Backups / DR | Operations → Recovery | `ops_recovery_*` | backup health, restore exercises, recovery verification |
| Agent management | Security → Agents | `admin_agent_*` | register, scope, lease, suspend, rotate, approve risky actions |
| Agent tasks / delegation | Operations → Agent Tasks | `agent_task_*` | inspect, approve, cancel, retry, result, escalation |

## Administration completeness rules

1. **No orphaned V1 capability:** every V1 domain must map to a human surface and an agent capability, unless the operation is intentionally human-only for security/compliance; such exceptions must be explicitly documented.
2. **Human and agent parity is semantic, not UI parity:** the agent does not need a dashboard, but it must be able to inspect and perform the same authorized operational class through MCP.
3. **Sensitive actions are not unrestricted:** payment refunds, entitlement changes, private-message access, account suspension, adult-policy changes, production configuration, data deletion, restore, and agent privilege changes require the declared risk/approval policy.
4. **Read-only diagnostics are separate from mutations.**
5. **All externally visible mutations are idempotent where applicable.**
6. **All sensitive mutations are audited with actor, capability, target, reason, policy decision and correlation identifiers.**
7. **Private content is never returned to generic analytics, audit, or agent results.**
8. **Admin UI is not the runtime dependency:** user traffic remains functional if the Admin route surface is unavailable.
9. **Agents do not receive a universal super-admin credential.**
10. **A documented endpoint is not enough:** the V1 Freeze Gate requires executable route/tool authorization and scenario tests.
