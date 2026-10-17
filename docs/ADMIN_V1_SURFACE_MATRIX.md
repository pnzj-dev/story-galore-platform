# V1 Admin Surface Matrix

Every V1 domain must have a human-operable Admin surface or an explicit human-only/approval exception, plus an authorized agent capability where safe.

Support is a required domain and includes user-facing and Admin UI routes defined in `docs/support/SUPPORT_UI_ADMIN.md`.

The Admin surface must not become a runtime dependency for public traffic. Admin actions go through the same domain authorization, Policy Engine, state-machine guards, idempotency, audit and correlation rules as agent actions.

## Application split

The Admin surface is split into two applications (see `docs/adr/0018-admin-app-split.md` and `docs/ADMIN_APP_SPLIT.md`):

- **Non-destructive** — 45 routes served by the public `apps/web` `/admin` surface (`risk: LOW|MEDIUM`, `approval: NONE`). Read projections and reversible/soft mutations: analytics, support, moderation, content ops, operations, AI, notifications, discovery, and economic simulation.
- **Destructive** — 8 routes plus the destructive mutations in `contracts/admin/destructive-operations.yaml`, served only by the standalone `apps/admin` (Fly.io → private intranet; `risk: HIGH|CRITICAL`, `approval: REQUIRED`). Money movement, permanent deletion, private-content/secret access, broad policy changes, hard account lifecycle, agent-privilege changes, and backup restore.

The canonical registry `contracts/permissions/admin-rbac.json` remains the single source of truth; each route is annotated `destructive: true|false`. The destructive subset is mirrored in `contracts/permissions/admin-rbac-admin-app.json`.
