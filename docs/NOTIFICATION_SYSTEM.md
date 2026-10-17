# StoryGalore Notification System

Status: canonical design and implementation contract; runtime implementation and provider deployment are **not claimed**.

## 1. Scope

One shared Notification Service serves the public/reader experience, Creator Studio, and Admin. It owns notification creation, user inbox state, preference evaluation, provider-neutral channel selection, delivery-attempt records, retries, and notification audit. It is not a direct-message/conversation service and is not an operational incident platform; those domains may produce registered events consumed by this service.

## 2. Canonical architecture

```text
Registered domain event / authorized command
                    |
                    v
      Appwrite Function: notifications
      - authenticate and authorize
      - validate event/command schema
      - deduplicate and resolve recipient
      - create canonical inbox notification
      - evaluate registered category/channel policy
                    |
          +---------+----------+
          |                    |
          v                    v
 Appwrite TablesDB       Cloudflare Workflows
 notification record     durable multi-channel delivery
 preferences             bounded retries / waits / recovery
 delivery attempts                |
          |                       v
          |             Registered provider adapters
          |             Appwrite Messaging where supported
          |             email / SMS / push only when verified
          v
 Appwrite Realtime
 user-scoped inbox invalidation/update
```

Appwrite TablesDB is the source of truth for notification records, preferences, and delivery attempts. Appwrite Realtime only updates the client view. Appwrite Messaging is the platform messaging capability; it is accessed only through registered adapters with verified provider contracts. Cloudflare Workflows is the sole durable workflow engine. Appwrite Functions must not become a second durable job runner.

Autonomous agents may request notification creation only through the Central Agent Gateway and its registered capability. Agents, browser clients, and arbitrary workflows must not send directly to providers. A workflow activity that writes Appwrite data must use an explicitly registered non-agent activity path; it must not bypass the Central Agent Gateway for agent-originated access.

## 3. Canonical resources

| Resource | Authority | Required access policy |
|---|---|---|
| `notifications` | One user's inbox item and read/dismissal state | Recipient may read their own rows; only authorized server commands write |
| `notification_preferences` | Per-user category/channel choices | Owner reads; changes go through validated command; server is authoritative |
| `notification_delivery_attempts` | Append-oriented channel delivery history | Privileged server only; operational views require explicit staff capability |

The desired TablesDB schema lists these resources. Actual Appwrite resource IDs, columns, indexes, and permissions must be generated/verified through official Appwrite tooling before deployment; logical IDs are not provider-generated IDs.

### Notification record

Required fields are declared in `contracts/deterministic/notifications/delivery-policy.yaml`. In particular, `readAt` and `dismissedAt` are independent from external delivery. `eventId + userId + notificationType` (or the registered equivalent idempotency key) prevents duplicate inbox entries. Templates use localization keys and schema-validated safe parameters, not arbitrary HTML.

### Delivery attempt

Each channel attempt records a provider-neutral status, attempt number, idempotency key, timestamps, and redacted provider error code. `SENT` means accepted by the provider; `DELIVERED` is permitted only when a verified receipt contract confirms it. `SUPPRESSED` is a terminal policy decision for that attempt, not a transport failure.

## 4. Command/query contract

Existing command/query names remain canonical:

- `notification_create`
- `notification_mark_read`
- `notification_mark_all_read`
- `notification_preference_update`
- `notification_retry_delivery`
- `notification_list`
- `notification_preferences_get`

All commands validate schema, authorization, resource ownership, idempotency, and audit requirements. List queries are user-scoped and cursor-paginated. Mark-all-read applies only to the authenticated user's active notifications. A retry command requires an explicit staff capability or a narrowly scoped system capability; users cannot force provider retries or select arbitrary provider IDs.

## 5. Event sources and categories

Only registered, versioned domain events may create notifications. Initial candidate categories are:

- Account/security: verification, recovery, sign-in/security alerts.
- Reader/community: creator followed, new publication, reaction, comment, reply, mention, poll closed, subject to block/mute/visibility checks.
- Creator workflow: generation or media processing completed/failed, validation results, publication status, scheduled publication outcome.
- Commerce: subscription status, receipt, payment failure, creator payout status. The ledger/payment domain remains authoritative for financial state.
- Moderation/support: decision or action relevant to the recipient; private evidence never included in notification content.
- Staff operations: delivery health and actionable operational alerts, restricted to authorized staff recipients.
- Product announcements: opt-in only.

This list does not authorize a new producer event by itself. Each producer event, recipient resolver, template, category, deep-link route, policy, and test must be registered before execution is enabled.

## 6. Channel policy

- **In-app:** canonical inbox record; independent of external provider health.
- **Email/SMS/push:** optional channel adapters only after provider API, authentication, consent, rate limits, errors, idempotency, and receipt semantics are verified.
- **Realtime:** subscribe only to the authenticated user's authorized notification records; never use a broad public channel for private notifications.
- **Topics:** opt-in grouping only; topic membership does not authorize access and staff topics are never exposed to public users.

Optional notification preferences control optional categories/channels. Security and transactional categories use a separately approved mandatory policy. Do not infer mandatory delivery channels, consent, jurisdiction, or default preference values. If the approved policy is missing, block external delivery and retain the in-app record where creation is authorized.

## 7. Deep links and content safety

Every notification uses a registered internal route ID and separately validated route parameters. Reject arbitrary URLs. Clicking a notification triggers normal route authorization and entitlement checks; notification possession grants no access. Push previews and email subjects must not disclose protected/adult content, private message text, payment credentials/details, moderation evidence, or other sensitive data. Use localized templates and minimal safe parameters.

## 8. Retry, idempotency, and failure handling

- Inbox creation and provider delivery are separate operations; a provider outage must not erase an inbox item.
- Every command and external send has an idempotency key. Replay must not create duplicate notifications or duplicate sends when provider semantics support idempotency.
- Durable multi-step delivery runs through Cloudflare Workflows, with bounded retries and persisted attempt history.
- Retry ceilings, delay/backoff, provider-specific retryable errors, and rate limits must come from the verified provider contract/configuration. Missing values block enablement; no guessed production defaults.
- Unknown provider errors fail safely, emit a redacted operational signal, and do not loop indefinitely.
- User dismissal/read actions do not cancel already queued mandatory transactional delivery unless a registered policy explicitly says so.
- Retention/cleanup must preserve required audit and delivery evidence; the retention period must be defined by the approved data-retention policy.

## 9. UI surface

### Shared user notification center

- Bell/action with accessible unread count; no count is exposed for another user.
- Responsive inbox panel on desktop and appropriate drawer/page on tablet/mobile.
- All/unread filtering, cursor pagination, mark-read, mark-all-read, dismiss, timestamp, category/type icon, and registered internal navigation target.
- Explicit loading, empty, error/retry, stale/offline, partial-data, and expired-session states.
- Realtime updates are advisory; refresh/query canonical state after reconnect.
- Accessible keyboard navigation, screen-reader announcements, visible focus, reduced-motion behavior, and light/dark themes.

### Creator Studio

Creator workflow, publication, engagement, and commerce notifications appear in the same inbox with category filters and safe deep links to authorized Studio routes. Creator-specific delivery analytics or retry controls are not shown unless an explicit capability allows them.

### Admin

Authorized staff can inspect delivery health, status counts, redacted failure codes, and attempt history; retry only registered retryable attempts through an audited command. Provider secrets, raw tokens, unrestricted payloads, and user-private content are never exposed. Every admin route/action needs an explicit capability; no blanket admin permission.

## 10. Required operational metrics

Track counts/rates for notifications created, duplicate suppression, in-app persistence failures, attempts by channel/provider/status, retry exhaustion, suppression reasons, provider latency, queue/workflow age, and dead-letter/permanent failures. Keep business notification content out of analytics. Mark unavailable metrics as unavailable, not zero. Metrics do not replace audit events.

## 11. Deterministic blockers before production

1. Resolve official provider contracts and adapter capability records for each enabled channel.
2. Approve category defaults, mandatory-message policy, consent/unsubscribe rules, quiet-hours/time-zone behavior, localization fallback, and jurisdiction-specific constraints.
3. Verify Appwrite TablesDB schema/index/permission definitions and generated resource IDs through official tooling.
4. Register each event producer, recipient resolver, localized template, route ID, payload schema, preference policy, and workflow mapping.
5. Pass authorization, tenant isolation, block/mute, protected-content, idempotency/replay, provider failure, retry exhaustion, rate-limit, secret-redaction, and audit tests.
6. Verify Appwrite Realtime scoping and reconnect behavior in an integration environment.
7. Enable providers only after all blockers for that provider are closed. In-app delivery can be validated independently.

Unknown provider contracts, absent policy, unregistered events/routes, unverified delivery semantics, missing resource IDs, and untested security behavior are blockers—not defaults to guess.
