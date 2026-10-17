# StoryGalore V15 — UI Route & State Contract

This document defines the minimum route/state coverage the coding agent must implement. It is intentionally framework-neutral at the contract level; Astro/Svelte implementation follows `DESIGN.md` and the official Astro/Svelte scaffolding rule.

## Public surface

| Route family | Required states |
|---|---|
| `/` discovery | loading, empty, partial, success, unavailable |
| `/search` | loading, empty, success, restricted, rate-limited, unavailable |
| `/series/:slug` | loading, success, not-found, removed, age-required, subscription-required |
| `/comic/:slug` | same as series + content processing/review states |
| `/read/:publication/:episode` | loading, page-loading, progress-saving, offline, restricted, age-required, entitlement-required, removed, retry |
| `/creator/:slug` | loading, success, not-found, restricted |
| `/library` | loading, empty, success, syncing, offline |
| `/account` | loading, success, permission-denied, error |
| `/account/billing` | loading, checkout-pending, confirmed, failed, reconciliation-pending |
| `/account/ai` | loading, empty, testing, connected, invalid, disabled, policy-blocked |

## Creator surface

Required route families include onboarding, dashboard, projects, project editor, story bible, characters, worlds, assets, comic editor, AI generation, drafts/revisions, media processing, moderation status, publication scheduling, analytics and settings.

Every editor must support: `saving`, `saved`, `offline`, `syncing`, `conflict`, `save_failed`, `recovery_available`.

## Admin surface

Required route families include overview, operations, content, creators, users, moderation, revenue, payments, advertising, AI operations, analytics, discovery, messaging, configuration, provider/model policy, security, audit and system health.

Every operational list must support: loading, empty, partial, filtering, pagination, permission-denied, unavailable, retryable failure and stale-data indication where applicable.

## No fake completion

A button must not be presented as complete if the backing mutation is not implemented. For asynchronous actions the UI must show the operation state and authoritative completion state. `toast("Success")` without a confirmed backend result is forbidden.
