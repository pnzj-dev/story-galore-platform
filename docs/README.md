# StoryGalore documentation map

This file defines how to read the documentation without mixing current requirements with historical decision records.

## Source-of-truth order

When two sources disagree, use this order and block implementation until the conflict is resolved:

1. **Current canonical machine-readable contracts** under `contracts/` define executable requirements.
2. **`AGENTS.md`** defines mandatory coding-agent behavior and repository-wide invariants.
3. **`docs/ARCHITECTURE.md`** and the latest versioned decision documents explain the architecture and rationale.
4. Domain-specific documents explain requirements within their declared scope.
5. Older versioned documents are historical records only when marked `HISTORICAL` or `SUPERSEDED`; they do not override current contracts.
6. Implementation code is not an authority for undocumented product policy. Existing code that conflicts with a contract must be corrected or the contract changed through an approved decision.

## Required first-read sequence

1. `../AGENTS.md` — global implementation and block rules.
2. `V1.md` — V1 product scope and acceptance requirements.
3. `ARCHITECTURE.md` — canonical system boundaries.
4. `history/releases/V18.8_CODING_AGENT_EXECUTION_SPEC.md` — task-to-contract implementation process.
5. `V19.5_DETERMINISTIC_EXECUTION_AND_VERIFICATION.md` — fail-closed implementation and validation.
6. The latest applicable versioned decisions: `history/releases/V19.5.8_BACKEND_RUNTIME_SIMPLIFICATION.md`, `V19.5.9_PLATFORM_NATIVE_SCAFFOLDING.md`, `V19.5.10_APPWRITE_ASTRO_SSR_SIMPLIFICATION.md`, and `V19.5.11_INDEPENDENT_ROUTE_AUTHORIZATION.md`.
7. `history/change-manifests/` contains prior release manifests; the current manifest is `../V19.5.19_CHANGE_MANIFEST.yaml`. Use `architecture/TECHNOLOGY_FRESHNESS_AND_VERSION_LOCK.md` for the latest-stable gate.
8. `history/repository-audits/REPOSITORY_AUDIT_V19.5.19.md` for the current before/after layout, coherence fixes, and remaining bootstrap blockers.
9. The domain contracts and tests named by the task.

## Canonical decisions

| Concern | Canonical source | Rule |
|---|---|---|
| Backend language | `contracts/architecture/backend-runtime-policy.yaml` | Go wherever technically supported; TypeScript only at registered platform boundaries and frontend/runtime boundaries |
| Platform scaffolding | `contracts/architecture/platform-native-scaffolding-policy.yaml` | Official pinned CLI/scaffolder owns generated structure |
| Web app/site | `contracts/appwrite/sites/deployment.yaml` and `contracts/astro/architecture.yaml` | One Astro app at `apps/web`, one Appwrite Site, Astro Node adapter for SSR |
| Route coverage | `contracts/astro/routes.yaml` | Every concrete Astro route must have exactly one effective registered policy |
| Route protection | `contracts/astro/route-protection.yaml` and `contracts/astro/middleware.yaml` | Middleware is an early gate; authoritative server-side operations reauthorize |
| Cross-system authorization | `contracts/security/authorization-completeness.yaml` | Every executable boundary maps to registered capabilities and resource policies |
| Agents | `contracts/agents/registry.yaml` and `contracts/agents/capability-registry.yaml` | Only registered agent IDs, tools and capabilities are executable |
| Durable execution | `contracts/execution/` and `docs/CLOUDFLARE_WORKFLOWS.md` | Cloudflare Workflows is the sole V1 durable workflow engine |
| Admin application split | `contracts/admin/admin-app-split.yaml` and `docs/adr/0018-admin-app-split.md` | Destructive ops in standalone `apps/admin` (Fly.io → intranet); non-destructive ops stay in `/admin` |
| PWA / offline | `contracts/clients/pwa.json` and `docs/PWA.md` | Public Astro app is an installable PWA; service worker never caches protected assets |

## Route authorization implementation gate

The route patterns in `contracts/astro/routes.yaml` are **policy templates**, not proof that the implementation's routes have been enumerated. Once Astro routes are scaffolded, the validator must enumerate every concrete route and verify exactly one effective policy. The planned Admin route registry currently contains 53 exact route entries, but generated-route parity and runtime authorization tests remain required before implementation is considered complete. A missing mapping is a blocker.

For each protected operation, tests must cover both the page request and direct requests to its Astro Action/API/backend/agent/MCP execution boundary. Route visibility is never authorization.

## Historical material

Older release notes and decision snapshots are grouped under `history/releases/`. They are retained for auditability and must not be treated as current instructions.

Release change manifests are archived under `history/change-manifests/`. They are audit records, not active implementation instructions.

Versioned documents explain how the architecture evolved. A historical document may describe a former design. If its requirements differ from current contracts, follow the current contract and do not implement the historical behavior. When an old document is still referenced by an active document, update that reference or add an explicit supersession note.

## Validation

Run `pnpm validate:docs` first, then `pnpm validate:contract-syntax`, `pnpm validate:astro-appwrite`, `pnpm validate:appwrite-functions`, and `pnpm validate:determinism`. Passing a syntax or consistency check does not prove production security; runtime tests and deployment-specific verification remain required.

## Authorization and route security (V19.5.13)

1. `AUTHORIZATION_IMPLEMENTATION_HANDOFF.md`
2. `../contracts/astro/route-inventory.yaml`
3. `../contracts/astro/route-protection.yaml`
4. `../contracts/permissions/route-access.yaml`
5. `../contracts/permissions/admin-rbac.json`
6. `../contracts/security/authentication-session-runtime.yaml`
7. `../contracts/security/authorization-acceptance-matrix.yaml`

The contracts specify intended behavior; they do not claim runtime security is implemented.

## Security and agent execution

- [Central Agent Gateway decision (V19.5.20)](V19.5.20_CENTRAL_AGENT_GATEWAY_DECISION.md) — Appwrite Function boundary, in-process policy engine, deterministic enforcement path, and blockers.


## Notifications (V19.5.22)

Read `NOTIFICATION_SYSTEM.md` and `../contracts/deterministic/notifications/` before implementing notification UI, event producers, or provider delivery. The in-app inbox, per-channel delivery state, provider adapters, durable workflows, preferences, and production blockers are separate explicit contracts.
