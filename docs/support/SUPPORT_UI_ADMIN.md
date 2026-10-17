# Support V1 — User and Admin UI Contract

Support is a first-class V1 product surface. Every support capability must be operable by an authorized human in Admin and, where safe, by the Support Agent through scoped capabilities.

## User routes
- `/help` — Help Center home/search
- `/help/articles/:slug` — article
- `/support` — support home
- `/support/new` — create ticket
- `/support/tickets` — ticket list
- `/support/tickets/:ticketId` — ticket detail/conversation
- `/support/tickets/:ticketId/attachments` — attachment state/error surface

## Admin routes
- `/admin/support` — Support overview
- `/admin/support/inbox` — unassigned/open queue
- `/admin/support/tickets` — ticket search/list
- `/admin/support/tickets/:ticketId` — ticket workspace
- `/admin/support/users/:userId` — scoped user support context
- `/admin/support/escalations` — escalation queue
- `/admin/support/sla` — SLA dashboard/rules
- `/admin/support/knowledge` — knowledge base
- `/admin/support/macros` — canned responses/macros
- `/admin/support/settings` — support policies/configuration
- `/admin/support/audit` — support audit events

## Admin ticket workspace
Must expose: ticket state, priority, category, assignee, requester, SLA clock, conversation, internal notes, attachments, related tickets, escalation controls, permitted user context, knowledge suggestions, macro insertion, audit history, resolve/reopen actions.

## User states
loading, empty, submitting, saved, offline, syncing, conflict, attachment_uploading, attachment_failed, waiting_for_support, support_replied, escalated, resolved, reopened, rate_limited, permission_denied, account_restricted, unavailable, retryable_error, permanent_error.

## Admin states
loading, empty, queue_refreshing, assignment_saving, reply_sending, internal_note_saving, escalation_pending, escalation_approved, escalation_denied, sla_breached, user_context_restricted, attachment_quarantined, permission_denied, step_up_required, unavailable, retryable_error, permanent_error.

## Human-only / approval actions
Account recovery overrides, exceptional refunds, exceptional private-data access, permanent deletion, ownership transfer, mass sanctions, and critical policy changes require the documented human approval path. UI must show why an action is restricted and the required approval state.

## UI rules
Use shared `packages/ui` components. No support-specific duplicate primitives. Every async mutation uses explicit loading/success/error states and durable idempotency. Admin never receives secrets, passwords, session tokens, BYOK keys, raw payment credentials, or unrestricted private-message contents.
