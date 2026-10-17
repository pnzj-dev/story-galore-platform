# Admin RBAC & Surface Contract

The `/admin` surface is capability-driven. An Admin role never implies access to every screen or operation.

## Rules

1. Navigation, routes, actions, data projections, and bulk operations are filtered by the same server-authoritative capability policy.
2. Hiding a menu item is UX only; every route and mutation is re-authorized server-side.
3. A user may hold multiple capabilities through roles, but effective access is the intersection of tenant scope, environment, capability, resource ownership, policy, and risk/approval requirements.
4. Support, Moderator, Finance, Analytics, SRE/Ops, Discovery, AI Operations, Security/Abuse, Community, and Admin are separate operational roles.
5. High-risk actions can be visible but disabled until an approval/step-up requirement is satisfied.
6. No role receives raw secrets, BYOK credentials, payment credentials, session tokens, or unrestricted private-message access.
7. Admin UI consumes safe projections; it must not fetch arbitrary Appwrite documents merely because the caller is an admin.
8. Impersonation is separately gated, scoped, time-limited, and audited.

## Role families

| Role | Primary surface | Examples | Not implicitly granted |
|---|---|---|---|
| Platform Admin | global administration | configuration, roles, policy | raw secrets, unrestricted private data |
| Support | customer operations | tickets, user context, knowledge base | moderation powers, refunds without approval |
| Moderator | safety/community | reports, moderation queues, sanctions | billing administration, secrets |
| Finance | money | payments, reconciliation, refunds | content moderation, private messages |
| Analytics | reporting | dashboards, aggregates, exports | mutation powers, raw private content |
| SRE/Ops | operations | workflows, health, incidents | user-content decisions unless separately granted |
| Discovery | search/recommendations | indexing, discovery policy | payment/security mutations |
| AI Operations | AI providers/jobs | provider health, model policy, AI operations | raw BYOK secrets |
| Security/Abuse | security | abuse cases, security events, restricted investigations | routine content/business mutations |
| Community | community | comments, messaging policy, community analytics | payment/security secrets |
| Creator Support | creator assistance | creator tickets/context | global admin controls |

## UI enforcement

Every admin route declares required capabilities and optional scope/approval metadata. The shell builds navigation from the same capability registry.

Example:

```text
route: /admin/support/tickets
capability: support.ticket.read
scope: support_workspace

route: /admin/payments/refunds
capability: finance.refund.request
risk: HIGH
approval: REQUIRED
```

Forbidden states must be explicit: `permission_denied`, `approval_required`, `restricted`, `not_found` (when disclosure should be avoided), `step_up_required`.

## V1 requirement

Every V1 admin-managed domain must define:
- human role(s)
- read capabilities
- mutation capabilities
- data projection
- route/menu visibility
- high-risk approval rules
- audit events
- corresponding agent capability where automation is allowed

The admin shell must never render a global "everything" role by default.


## Canonical route registry (V19.5.13)

`contracts/permissions/admin-rbac.json` is the canonical V1 planned exact-route registry for every `/admin` route named in the current V1 documentation. The registry is complete for that documented scope, not a claim that the corresponding Astro route files or runtime authorization have been implemented. Every newly proposed admin route must add a registry entry before implementation. The route inventory and registry must agree exactly after dynamic parameters are normalized.

`PLATFORM_ADMIN` is not a bypass: each route still requires its registered capability, scope, safe projection, and any required approval. Unknown roles/capabilities, missing scope, unavailable policy evaluation, or missing approval deny the operation.

## Application split

The `/admin` surface is split into two applications (see `docs/adr/0018-admin-app-split.md` and `docs/ADMIN_APP_SPLIT.md`):

- **Non-destructive** (`risk: LOW|MEDIUM`, `approval: NONE`) — 45 routes served by the public `apps/web` `/admin` surface.
- **Destructive** (`risk: HIGH|CRITICAL`, `approval: REQUIRED`) — 8 routes plus the destructive mutations in `contracts/admin/destructive-operations.yaml`, served only by the standalone `apps/admin` (Fly.io → private intranet), never the public surface.

The canonical registry in `contracts/permissions/admin-rbac.json` remains the single source of truth; each route is annotated `destructive: true|false`. The destructive subset is mirrored in `contracts/permissions/admin-rbac-admin-app.json`.
