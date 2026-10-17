# Admin Application Split

StoryGalore's admin capability is split across two applications to isolate destructive operations from the public surface.

## Two applications

| | Non-destructive admin | Destructive admin |
|---|---|---|
| App | `apps/web` (Astro) | `apps/admin` (SvelteKit) |
| Surface | `/admin/**` routes within the public app | standalone app |
| Runtime | Astro SSR (`@astrojs/node`) | `@sveltejs/adapter-node` driven by the Nub toolchain |
| Hosting | Appwrite Site (public) | Fly.io initially, private intranet long-term |
| Network | public | restricted (IP allowlist / private network) |
| Operations | read + reversible/soft mutations (`risk: LOW|MEDIUM`, `approval: NONE`) | destructive mutations (`risk: HIGH|CRITICAL`, `approval: REQUIRED`) |

## Classification rule

An operation is **destructive** when it is irreversible, moves money, reveals secrets or private content, changes policy with broad blast radius, performs a hard account lifecycle action, or changes agent privileges. Otherwise it is **non-destructive**.

The route registry classification is derived from `contracts/permissions/admin-rbac.json`:

- **45 non-destructive routes** remain in `apps/web` `/admin`.
- **8 destructive routes** move to `apps/admin` (`contracts/permissions/admin-rbac-admin-app.json`):
  - `/admin/payments/refunds`
  - `/admin/security/private-message-access`
  - `/admin/operations/media-distribution`
  - `/admin/support/settings`
  - `/admin/economics/governance`
  - `/admin/economics/pricing`
  - `/admin/economics/reserves`
  - `/admin/economics/tax`

Destructive mutations that are not yet enumerated as routes (permanent deletion, impersonation, secret access, agent-privilege changes, backup restore) are defined in `contracts/admin/destructive-operations.yaml` and are only ever reachable through `apps/admin`.

## Shared code

Both apps reuse:

- `packages/ui` — shared Svelte 5 component library. The destructive admin uses a **professional console** variant (dense, layerchart-based analytics, mandatory dark mode), distinct from the public cinematic theme.
- `packages/domain` — shared types and invariants.
- `packages/config` — shared runtime configuration.
- `packages/appwrite-client` — the browser factory for `apps/web`; `apps/admin` uses a server-side `node-appwrite` helper with a narrowly scoped API key from the environment.

## Authorization

Both apps are capability-driven. Authorization is always server-side:

- `apps/web` `/admin` routes are gated by `contracts/permissions/admin-rbac.json` via Astro middleware plus the Policy Engine.
- `apps/admin` mutations are gated by `contracts/permissions/admin-rbac-admin-app.json` and the Policy Engine through server-side Appwrite SDK / Go functions. No browser API key is used.

Route hiding is UX only. No client-supplied role, capability, or plan flag is authoritative.

## Contracts

- `docs/adr/0018-admin-app-split.md` — decision.
- `contracts/admin/admin-app-split.yaml` — topology and classification rule.
- `contracts/admin/destructive-operations.yaml` — operation classification.
- `contracts/admin/apps-admin-runtime.yaml` — `apps/admin` runtime, toolchain, hosting, backend.
- `contracts/permissions/admin-rbac.json` — full route registry (annotated with `destructive`).
- `contracts/permissions/admin-rbac-admin-app.json` — destructive route registry.
