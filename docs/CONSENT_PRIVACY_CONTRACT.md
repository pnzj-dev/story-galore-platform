# StoryGalore V1 — Consent & Privacy Contract

## Purpose

Define the V1 contract for user consent, privacy preferences, withdrawal, and data-use choices. This contract does not replace legal advice or jurisdiction-specific requirements; stricter applicable law wins.

## Decision classes

1. **Necessary processing** — required for account, security, fraud prevention, billing, entitlement, moderation, service operation, and other legally permitted essential functions. Never represented as optional marketing consent.
2. **Explicit consent** — processing/use requiring affirmative opt-in where applicable. No pre-checked controls.
3. **Product preference** — user-controlled behavior that is not itself a privacy consent (for example adult-content display). Default is safe/off where specified.
4. **Withdrawal** — must be as easy as granting consent; withdrawal affects future processing and does not retroactively invalidate lawful historical processing.

## V1 consent/preference matrix

| Area | Default | User action | Server enforcement |
|---|---|---|---|
| Adult content display | OFF | Explicit ON | Required in every content/discovery path |
| Behavioral/product analytics | Jurisdiction-dependent | Consent where required | No non-essential tracking when denied |
| Session replay | OFF | Explicit ON where used | No replay when denied |
| Personalized advertising | OFF | Explicit ON | Contextual ads may remain subject to law |
| Marketing email/push | OFF | Explicit ON | Suppression enforced server-side |
| Creator/product notifications | User-configurable | Category preferences | Notification service enforces |
| AI/model improvement use | OFF | Explicit ON | No training/improvement use when denied |
| Security/transactional notifications | Required/operational | Category controls where legally permitted | Cannot be silently converted into marketing |
| Essential service telemetry | Minimum necessary | Not an optional marketing consent | Minimize, classify, retain only as needed |

## Consent record

Persist a versioned record containing:
- consent/preference key
- actor/user ID
- scope/tenant
- jurisdiction when relevant
- state/value
- consent version
- policy/legal basis reference
- source (web, mobile, admin-assisted, API)
- effectiveAt
- withdrawnAt when applicable
- createdAt/updatedAt

Never store unnecessary raw UI payloads, secrets, authentication tokens, or payment credentials.

## Enforcement

Consent and privacy decisions are server-authoritative. Client state is advisory and cannot grant permission. Every integration that processes optional data must evaluate the applicable preference/consent before collection or use.

Consent must be checked at the boundary for:
- PostHog and other analytics
- session replay
- advertising personalization
- marketing messaging
- AI/model improvement pipelines
- exports or secondary processing
- third-party processors where consent is the applicable legal basis

## Adult-content rule

Adult display is a product eligibility preference, not a substitute for age assurance or entitlement. Adult content requires all applicable gates, including age eligibility, paid entitlement, explicit adult-display enablement, global policy, publication/moderation status, and provider/content policy.

## Withdrawal

Withdrawal takes effect without undue delay and propagates to active clients, caches, analytics/marketing adapters, messaging eligibility, and future processing. Existing financial/domain records remain authoritative and are retained where legally/operationally required.

## Privacy center

V1 should expose a unified privacy/preferences surface where users can review and change:
- analytics
- session replay
- personalized advertising
- marketing communications
- AI/model-improvement use
- adult-content display
- notification categories

The UI must distinguish **consent** from **product preference** and from **necessary processing**.

## Data minimization

Optional analytics and marketing events must use the minimum attributes necessary. Private messages, provider credentials, prompts, payment credentials, session tokens, and unnecessary sensitive data are prohibited from optional analytics.

## DSAR/deletion interaction

Consent withdrawal is not equivalent to account deletion. Account deletion and DSAR workflows must use the dedicated deletion contract and propagate deletion to processors/providers where required.

## Jurisdiction

The Policy Engine resolves the applicable privacy regime using configured jurisdiction rules. Where a stricter rule applies, the stricter rule wins. Unknown or unavailable policy state must fail safe for optional processing.
