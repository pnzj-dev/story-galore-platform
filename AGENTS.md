# Coding Agent Instructions

## Mission

Build the creator media platform described by this repository. Books are the flagship publication type; the underlying publication/media model must also support images/galleries, creator posts, short video, long video, audio and mixed media. Treat this file and `docs/` as the source of truth for product/domain intent.

## Non-negotiable rules

1. Use **Astro + Svelte** for the web application.
2. Keep the web application in this monorepo and maximize reuse through `packages/*`.
3. Use **Appwrite as the application platform** unless a requirement in this repository explicitly calls for an external service.
4. Use **Go for Appwrite Functions**.
5. Use official Appwrite CLI/Console/Terraform capabilities. Do not invent an Appwrite deployment format.
6. Use Appwrite TablesDB, DocumentsDB and VectorsDB deliberately; do not put everything in one storage mechanism.
7. Treat media as a first-class domain; do not create a comic-only storage/publication abstraction that blocks future image/video/audio formats.
8. Use Appwrite Storage with bucket/file security and virtual folders.
9. Use Appwrite Auth features instead of implementing custom authentication.
10. Use Appwrite Messaging and Realtime rather than creating parallel notification/socket infrastructure.
11. Use Appwrite Firewall for edge controls.
12. Payment processors are adapters behind a `PaymentService`; application/domain code must not depend on a provider SDK.
13. Never put payment-provider secrets in browser code.
14. Never make adult-content authorization a frontend-only check.
15. Never treat a client-provided subscription flag, age flag, role, or plan ID as authoritative.
16. AI generation must be metered and entitlement-checked server-side.
17. Large media uploads must use Appwrite Storage directly after server-authorized upload initiation; do not proxy all page bytes through an MCP endpoint.
18. Use idempotency for payment webhooks and domain event consumers.
19. Preserve AI generation provenance and publication/version history.
20. Do not silently weaken permissions to make a feature work.
21. Before changing a schema, check `docs/DOMAIN_MODEL.md` and update the desired schema manifest.
22. Before using an Appwrite API, verify the current SDK/API shape in official Appwrite docs or generated types.
23. If an official Appwrite scaffold is available, prefer it over hand-written infrastructure.

## Media product rules

- V1 focuses on books plus images/galleries.
- Creator posts/mixed media follow after the core book workflow.
- Short video is the first video format; long video is phased later.
- Video orientation and duration are properties, not separate top-level types.
- Video/audio processing and playback must be feature-flagged until storage, transcoding and egress economics are validated.
- Shared projects/universes should be able to contain multiple publication types.

## Monorepo rules

- The single `apps/web` application may depend on shared packages.
- Shared packages must not import site-specific code.
- Domain package contains pure TypeScript types/invariants only.
- `appwrite-client` contains Appwrite integration helpers.
- UI package contains reusable Svelte components without site routing assumptions.
- Admin-only capabilities must never leak into public bundles. Route hiding is not authorization; each server-side operation must enforce its registered capability.

## Appwrite rules

- Browser code uses Client SDK/session/JWT patterns appropriate to SSR.
- Appwrite Functions and backend services use Go wherever technically supported. Astro SSR site code uses TypeScript/JavaScript under the registered Astro Node runtime boundary; privileged operations still delegate to authorized backend commands and must use narrowly scoped credentials.
- Prefer user sessions/JWT when permission evaluation should apply.
- API keys are privileged and must be scoped narrowly.
- Use labels for broad subscription/access cohorts only where they improve Appwrite permissions; the domain entitlement engine remains authoritative.
- Use Teams for creator collaboration and internal operations roles; do not use Teams as the subscription system.
- Use user Preferences for user-controlled UX settings, not financial state.
- Use user Labels for access cohorts, not as the only source of truth for entitlements.
- Use impersonation only for trusted support/admin workflows and record audit events.
- Use MFA for staff and sensitive creator/admin actions.

## Coding style

- TypeScript: strict.
- Go: gofmt, idiomatic errors, context-aware calls where supported.
- Validate all external input.
- Keep functions small and domain-focused.
- Add tests for authorization, payments, content classification, and idempotency.
- Do not commit secrets, real project IDs, real API keys, or production URLs.

## Completion standard

A feature is not complete until:
- UI exists where appropriate.
- Domain contract exists.
- Appwrite permissions are specified.
- Server-side authorization exists.
- Realtime/messaging behavior is specified if relevant.
- Audit/analytics events are specified if relevant.
- Tests exist for critical invariants.
- Docs are updated.

## Visual implementation contract

Before implementing UI, read `/DESIGN.md` and inspect `/docs/design-reference.png`. The reference is the visual target for the public route surface and protected Admin dashboard. Do not replace it with a generic SaaS template.

Use Tailwind CSS + Bits UI + Lucide through the shared UI package. Implement the public site as a cinematic, artwork-first experience and the admin as a dense operations/analytics console. Implement the eight overview KPIs and the three primary charts specified in DESIGN.md.

Advertising is a first-class subsystem. Implement it from the server side and expose its management in `Ads & Monetization` in the protected Admin route surface. Never let the client decide ad eligibility.


## V1 shipping rule
Read `docs/V1.md` before implementing. V1 must be fully functional end-to-end. Do not substitute mock data, fake payment success, placeholder handlers, dead navigation, or UI-only authorization for working Appwrite-backed behavior. When a later capability is intentionally deferred, gate it behind a feature flag and keep the V1 path complete.

## Product name
Use StoryGalore as the working product name. Read `docs/NAMING.md` for naming constraints.

## Cloudflare Workflows workflow boundary

Use Cloudflare Workflows as the sole V1 durable workflow engine for durable/long-running/retryable workflows. Do not use it for ordinary request/response paths. Domain/application code depends on a workflow-runner interface; Cloudflare Workflows SDK usage belongs in registered Cloudflare platform-boundary code written in TypeScript. Appwrite Functions and other backend services use Go. Cloudflare Workers are real edge/runtime boundaries and use TypeScript where required by the platform; they are not a substitute for the durable workflow engine. Local development must work without production Cloudflare credentials. See `docs/CLOUDFLARE_WORKFLOWS.md`.

## Agent-to-Appwrite boundary

The Central Agent Gateway is an Appwrite Function with an in-process Policy Engine. Autonomous agents access Appwrite only through the registered Appwrite MCP connection and gateway. Cloudflare MCP is not part of the StoryGalore application runtime or deployment graph; if used by the Coding Agent, it belongs exclusively to a separately managed developer tooling environment.

## Agent operation observability

Record normalized Central Agent Gateway decisions and tool-operation events, including request volume, success rate, latency, policy denials, per-tool activity, durable operation status, Cloudflare Workflows backlog, and cross-system correlation. Do not create a Cloudflare MCP service dashboard or store raw prompts, secrets, authorization tokens, or unnecessary personal data. See `docs/V1_OPERATIONS.md`.

## V1 hardening

Do not ship a V1 feature as UI-only. Critical operations require server-side authorization, idempotency, observability, auditability, failure handling, and tests. Use the Operations Center for operational health, enforce MCP security, use durable cost reservation/settlement for expensive operations, and document backup/restore and retention/deletion. See `docs/V1_OPERATIONS.md`.
## Brand naming

Treat StoryGalore as a temporary codename until formal domain/trademark/app-store clearance is completed. Do not perform a repository-wide rename based on an unverified candidate. See `docs/NAMING_CLEARANCE.md`.

## UI real-scenario gate

The UI is not complete when routes merely exist. Implement and validate every journey in `docs/UI_SCENARIO_MATRIX.md` and every state in `docs/UI_ROUTE_STATE_CONTRACT.md`.

Use `docs/UI_E2E_CONTRACT.md` as the browser-test contract. E2E tests must exercise the real staging integration for authoritative behavior; tests that mock every backend call do not satisfy the V1 gate.

No UI may display mutation success before authoritative backend acceptance. Asynchronous operations must expose their operation state. Editors must implement server-confirmed autosave, offline/reconnect, conflict and recovery states. Protected content must be authorized before asset delivery. Payment UI must treat provider webhooks/reconciliation as authoritative.

Run `pnpm validate:ui` before V1 freeze.

## Shared UI component library

`packages/ui` is the canonical StoryGalore UI system. Use its Svelte 5 + Tailwind + Bits UI + Lucide components across the web application. Search the package before creating reusable UI. Do not duplicate primitives or introduce an alternative component library. Site-local components are allowed only for genuinely page-specific composition. Read `docs/UI_COMPONENT_LIBRARY.md` before implementing UI. Run the UI component contract tests before V1 freeze.

## V15.5 Runtime Simplicity Rule
Use the simplest runtime profile that satisfies the task. CORE is the default. Activate WORKFLOW only for durable/long-running/retryable work. Activate EXTENSION only for enabled optional capabilities. Do not add services, databases, state machines, workflows, agents, or external dependencies without justification in the task contract or an ADR.


## Download/offline rule

Do not add a direct Storage download button for protected publication assets. Every download/offline/export flow must use the publication download policy + entitlement + Policy Engine contract in `docs/DOWNLOAD_OFFLINE.md`. Never expose source assets, permanent protected URLs, storage credentials, or bypass authorization because content is already cached.


## V1 Agent Platform

All agents listed in `docs/AGENT_FAMILY_V1.md` are V1 scope, including CEO, Data Analysis & Reporting, Coding / Dev, Story Producer and the agents previously considered V1.5. Native agents run on Cloudflare Agents. External agents connect through the Agent Gateway using provider-neutral MCP/A2A-compatible adapters.

Every agent task must use `contracts/agents/task.yaml`; every delegation must use `contracts/agents/delegation.yaml`; capabilities must come from `contracts/agents/capability-registry.yaml`; trust never substitutes for authorization.

## GitHub-first software engineering

GitHub is the V1 engineering system of record. Support tickets remain in StoryGalore; engineering escalations map to canonical GitHub Issues. Coding agents must follow `docs/GITHUB_CODING_AGENT_WORKFLOW.md` and `contracts/coding/pipeline.yaml`. The default terminal state is `DEPLOYMENT_CANDIDATE`; production requires separate explicit authorization.

## Internationalization and language filtering

- Internationalization is a V1 requirement; do not defer it to V1.5.
- Read `docs/history/releases/V18.6_INTERNATIONALIZATION.md` before implementing locale, language, discovery, reader, notification or UI localization work.
- Keep UI locale separate from preferred content languages.
- Store language identifiers as canonical BCP 47 tags; never use translated labels as identifiers.
- Content-language filtering is server-authoritative and must happen before cursor pagination, recommendations, or cache acceptance.
- Support `ALL` and `ONLY_SELECTED`; `ONLY_SELECTED` must exclude publications with missing/unknown language metadata.
- Never let language filtering bypass authentication, entitlement, age, jurisdiction, adult-content, moderation, or publication-status policy.
- Derive RTL/LTR from locale metadata and use CSS logical properties instead of hard-coded left/right layout rules.
- SSR and client hydration must resolve the same locale/direction.
- Localizations are separate approved editions of the same canonical work and must preserve provenance; AI translations must not overwrite source content.


## V18.8 Coding Agent Execution Specification

Before implementation, read `docs/history/releases/V18.8_CODING_AGENT_EXECUTION_SPEC.md`. Resolve every task through `contracts/implementation/task-contract.yaml`, `contracts/implementation/implementation-registry.yaml`, `contracts/implementation/source-ownership.yaml`, and the applicable domain/provider/UI contracts. Missing or ambiguous mappings are blockers. Do not infer business policy from existing code. Every bug fix requires a deterministic regression test and provenance from ticket to PR. Use `contracts/implementation/definition-of-done.yaml` as the release gate. Run `pnpm validate:implementation-spec`.

## V19.3 Professional UI + Astro + Appwrite Sites

V19.3 adds a deterministic UI and web-runtime contract. Before changing UI or Astro code, read `docs/history/releases/V19.3_PROFESSIONAL_UI_ASTRO_APPWRITE_SITES.md` and the applicable files under `contracts/ui/`, `contracts/astro/`, and `contracts/appwrite/sites/`.

Hard rules:
- Astro is the default page/rendering/composition layer; Svelte 5 is used only as an interactive island where required.
- Use Astro file-based routing, layouts, Content Collections, Markdown/MDX, `astro:assets`, View Transitions, middleware, Actions, endpoints, prerendering and on-demand rendering according to their contracts.
- Do not create a custom router or full client-side SPA without an explicit architecture decision.
- Appwrite Sites is the canonical web hosting target for the single `apps/web` application.
- Do not introduce another hosting platform without an explicit ADR/architecture decision.
- Use the official Appwrite Sites Astro configuration and current documented SSR/runtime behavior; never invent Appwrite deployment settings.
- Every route declares rendering and hydration intent; missing or ambiguous intent is a blocker.
- Every reusable UI component follows the visual system, semantic tokens, accessibility, responsive, theme, RTL, state and visual-regression contracts.
- Use `astro:assets` for site-owned images and the existing Appwrite Storage/media-distribution contract for creator media.
- Content Collections do not replace Appwrite authoritative runtime domain state.
- Middleware supplies request context but never replaces the Policy Engine.
- Astro Actions are web adapters and must delegate to canonical domain commands.


## Platform-Native Scaffolding (V19.5.9)
Never invent a platform-specific project layout when the platform provides an official scaffolder. Use the pinned official CLI, inspect its output, register the generated structure, then implement the StoryGalore contracts. Undocumented platform layout assumptions are BLOCKED.

## V19.5.10 Canonical Astro SSR + Appwrite Sites

- StoryGalore has exactly one Astro web application at `apps/web`.
- The canonical production web host is exactly one Appwrite Site.
- The Astro application uses the official `@astrojs/node` adapter with `output: "server"` and standalone mode.
- Appwrite Sites uses `framework: astro` and Site `adapter: ssr`. This Appwrite setting is the Site rendering mode; it is not an `@astrojs/appwrite` package.
- Public, Creator Studio and the non-destructive Admin surface are route surfaces within `apps/web`; they are not separate Astro applications or Appwrite Sites.
- The official Astro CLI owns Astro-generated structure. The official Appwrite CLI owns Appwrite Site configuration/generated structure. Inspect and register generated output before implementation.
- A second web Site or alternate web host is BLOCKED without an approved architecture decision. ADR-0018 (accepted) provides that approval: the complete admin console is a separate intranet-only SvelteKit application `apps/admin` containing both non-destructive and destructive routes; the public `apps/web` keeps only the non-destructive `/admin` subset.


## V19.5.11 Independent Route Authorization

- Public, authenticated-user, Creator Studio, and Admin route groups have separate registered protection policies inside the single Astro app.
- Every concrete route must map to `contracts/astro/routes.yaml`; missing or ambiguous mappings BLOCK implementation.
- Astro middleware performs early authentication/policy gating, but the Policy Engine and authoritative backend command/function independently enforce authorization.
- Never trust client-supplied roles, capabilities, actor IDs, or authorization claims.
- Admin access requires explicit admin authorization plus the route-specific capability; a valid session alone is insufficient.
- Backend APIs and mutation actions return contract-defined authorization errors rather than relying on redirects.
- Route-specific overrides may strengthen a parent policy, never weaken it without an approved contract change.


## V19.5.12 Documentation Consistency Gate

Before implementation, read `docs/README.md` for the canonical documentation hierarchy. Current machine-readable contracts outrank explanatory prose; historical/superseded documents do not override current contracts. Run `pnpm validate:docs` before implementation and after documentation changes. If the validator, contracts and current architecture disagree, stop and resolve the contradiction rather than selecting an interpretation. Route patterns are policy templates, not proof of complete route coverage. Admin route implementation is BLOCKED until `contracts/permissions/admin-rbac.json` contains an exhaustive exact-route registry and its status is marked complete. Documentation checks do not substitute for runtime authorization tests.


## Latest-stable technology requirement (V19.5.14)

Every language, runtime, framework, adapter, SDK, CLI, build tool, package manager, test tool, and dependency MUST use the latest stable release compatible with the approved architecture, verified against official sources immediately before implementation bootstrap and rechecked before release. Exact versions and lockfiles are mandatory. Never treat an existing pin as proof it is latest. If the latest stable version is incompatible, BLOCK; do not silently downgrade. Exceptions require a reviewed ADR with evidence, owner, expiry/recheck date, and explicit approval. Complete `contracts/architecture/technology-version-lock.yaml` before implementation; until it is complete, implementation is BLOCKED. See `contracts/architecture/technology-freshness-policy.yaml` and `docs/architecture/TECHNOLOGY_FRESHNESS_AND_VERSION_LOCK.md`.

## Mandatory Appwrite MCP boundary for autonomous agents

Autonomous agents MUST access Appwrite only through the central Agent Gateway, Policy Engine, and registered Appwrite MCP connection. Never use direct Appwrite SDK/HTTP access from agent runtime code. Normal Astro and Go application code may use only their separately registered native integration paths. No Cloudflare MCP server is deployed as part of StoryGalore. Per-agent allowlists are deny-by-default. Do not reuse a developer OAuth session or shared unrestricted credential. The official Appwrite MCP unattended authentication mode and native tool catalog MUST be verified before runtime implementation; until then, BLOCK. See `contracts/integrations/appwrite-mcp-connection.yaml`, `contracts/integrations/agent-appwrite-tool-allowlists.yaml`, and `contracts/integrations/appwrite-mcp-tool-registry.yaml`.
