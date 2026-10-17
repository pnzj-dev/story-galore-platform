# StoryGalore Client Architecture

V1 is client-agnostic. Web is the primary shipped client, while Android, iOS, and Desktop are future first-class clients.

## Clients
- WEB
- ANDROID
- IOS
- DESKTOP

## Rule
Business rules, authorization, entitlements, age eligibility, policy decisions, downloads, messaging, reading progress, and analytics contracts MUST NOT depend on a browser or a specific UI framework.

Clients use the same server/domain contracts and implement client-specific adapters for storage, notifications, deep links, filesystem access, and OS capabilities.

## Architecture
Domain Services -> client-neutral API/contracts -> Web / Android / iOS / Desktop adapters.

No client may become the source of truth for authorization, payment state, entitlement, or policy.
