# ADR-0018 — Split Admin into a Non-Destructive `/admin` Surface and a Standalone Destructive Admin App

Status: Accepted

## Context

StoryGalore currently specifies a single capability-driven `/admin` route surface inside the single Astro web application (`apps/web`), governed by `contracts/permissions/admin-rbac.json`. Canonical contracts enforce a single web application and a single Appwrite Site:

- `contracts/astro/architecture.yaml` — `canonical_web_application_count: 1`; public, creator, and admin are route surfaces of the same app.
- `contracts/appwrite/sites/deployment.yaml` — `canonical_site_count: 1`; `other_hosting_platform_without_adr: BLOCK`.
- `AGENTS.md` V19.5.10/V19.5.11 — a second web Site or alternate host is BLOCKED without an approved architecture decision.

Operational reality separates admin work into two classes:

1. **Non-destructive** — read projections and reversible/soft mutations (moderation hide/restore, support ticket/KB/macro management, ops retry/cancel/rollback, analytics, feature flags). These are safe to expose on the public host behind capability authorization.
2. **Destructive** — irreversible deletion, money movement, secret/credential access, broad-blast-radius policy changes, hard account lifecycle, and agent-privilege changes. These must never live on a public-reachable surface.

## Decision

Split the admin surface into two applications:

1. **Non-destructive admin** — a `/admin/**` route surface inside `apps/web` (Astro). Contains operations classified `NON_DESTRUCTIVE` (`risk: LOW|MEDIUM`, `approval: NONE`). This is the non-destructive subset only, reachable from the public host behind capability authorization.
2. **Complete admin console** — a new standalone SvelteKit application `apps/admin`, served with `@sveltejs/adapter-node` and driven by the Nub toolchain, hosted on Fly.io initially and on a private intranet long-term. Because it is an intranet application it must be complete: it contains **all** admin routes — both non-destructive (45) and destructive (8) — from `contracts/permissions/admin-rbac.json`. Destructive operations are classified `risk: HIGH|CRITICAL`, `approval: REQUIRED`, plus destructive mutations not yet enumerated as routes (deletion, impersonation, secrets, agent-privilege, backup restore).

Non-destructive routes are duplicated in both apps; destructive routes exist only in `apps/admin`.

This decision amends `canonical_web_application_count` and `canonical_site_count` to permit a second, non-Appwrite-Sites, intranet-bound admin application, while the public app remains the single Appwrite Site.

## Rationale

- Destructive capabilities must be network-isolated from the public surface regardless of authorization strength (defense in depth).
- Keeping non-destructive operations in `/admin` avoids fragmenting routine ops and preserves the existing route/RBAC registry with minimal churn.
- The split is expressed as a `destructive` classification dimension over the existing route registry rather than a rewrite, preserving validator parity.

## Non-goals

- No new public web host; `apps/web` remains the single Appwrite Site.
- No Turborepo; pnpm workspaces remain the orchestrator (Nub is a drop-in for `pnpm run`/`pnpm install` and reads `pnpm-lock.yaml`/`pnpm-workspace.yaml` in place).
- No change to the backend runtime policy; destructive operations still execute through Go functions / server-side Appwrite SDK and the Policy Engine.
- No change to the agent/MCP boundary; the Central Agent Gateway remains the only Appwrite access path for autonomous agents.

## Consequences

- New application `apps/admin` and contracts under `contracts/admin/`.
- New destructive route registry `contracts/permissions/admin-rbac-admin-app.json`.
- `contracts/astro/architecture.yaml` and `contracts/appwrite/sites/deployment.yaml` are amended to allow the second admin application.
- `contracts/permissions/admin-rbac.json` and `contracts/astro/route-inventory.yaml` are annotated (not renumbered) to preserve existing validator parity.

## Migration

1. Add the classification contracts and this ADR (this change).
2. Scaffold `apps/admin` with the official SvelteKit CLI plus `@sveltejs/adapter-node`.
3. Implement non-destructive `/admin` routes in `apps/web` first; then implement the complete `apps/admin` console (all 53 routes — non-destructive duplicates plus destructive) behind Fly.io/IP-allowlist and, later, private intranet restriction.
4. Wire both apps to the Policy Engine; destructive operations require approval/break-glass plus audit and idempotency.

## Alternatives considered

- Keep a single `/admin` surface with step-up auth for destructive operations — rejected: it keeps destructive capabilities reachable on the public host.
- Two Astro applications — rejected: the destructive console is an internal tool; SvelteKit + adapter-node + Nub matches the "web and admin are separate applications" standard.

## Security

Both apps enforce server-side capability authorization. The destructive app is network-restricted (IP allowlist / private network) even on Fly.io, and never uses a browser key; all destructive mutations go through the Policy Engine with approval, audit, and idempotency. Private-content access remains an explicit, case-bound, approval-gated capability.
