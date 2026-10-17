# StoryGalore — Coding Agent Kit

This repository is an **agent-ready implementation blueprint** for a production creator media platform with books as the flagship publication type, built around:

- Astro 7 + Svelte 5 web application in a pnpm monorepo
- Appwrite Cloud as the primary application platform
- Appwrite Auth, Teams, Labels, Preferences, MFA, Sessions and Impersonation
- Appwrite TablesDB for strongly typed transactional/domain data
- Appwrite DocumentsDB for flexible JSON documents
- Appwrite VectorsDB + Embeddings for semantic search/recommendations
- Appwrite Storage for original assets, processed pages, previews and downloads
- Appwrite Functions using **Go**
- Appwrite Messaging for email/SMS/push notifications
- Appwrite Realtime for live UI updates
- Exactly one Appwrite Site hosting one Astro SSR application; Public, Creator Studio and Admin are separately protected route surfaces
- Appwrite Firewall for edge protection, rate limiting, challenges and incident controls
- Appwrite Avatars for initials, QR codes, flags, payment icons, favicons and image utilities
- Multi-provider fiat/card and crypto payment orchestration
- AI comic/media generation, metering, drafts, versions and publication
- Media-agnostic publications: comics, images, creator posts, short/long video, audio and mixed media
- Adult/18+ content controls with server-side entitlement enforcement

## Agent-to-Appwrite access boundary

Autonomous agents MUST access Appwrite only through the central Agent Gateway, Policy Engine, and registered Appwrite MCP connection. Per-agent tool allowlists are deny-by-default. No Cloudflare MCP server is part of the StoryGalore application. Direct agent SDK/HTTP access, self-selected native tools, shared unrestricted credentials, and developer OAuth-session reuse are prohibited. The official Appwrite MCP endpoint is documented at https://appwrite.io/docs/tooling/ai/mcp-servers; its unattended runtime identity model remains an explicit blocker until verified. See `contracts/integrations/appwrite-mcp-connection.yaml`, `contracts/integrations/agent-appwrite-tool-allowlists.yaml`, and `contracts/integrations/appwrite-mcp-tool-registry.yaml`.

## Important implementation rule

Do not invent an Appwrite resource format. Where Appwrite CLI/Console/Terraform is the official provisioning path, the coding agent must use the official tool to initialize the resource, then commit the generated resource definition.

The kit deliberately contains **desired schemas/manifests** rather than pretending they are already-valid generated Appwrite CLI exports.

## First step

Read `AGENTS.md`, then `docs/README.md` for the source-of-truth hierarchy and implementation reading order.

Then execute `scripts/bootstrap.sh` (or follow its commands manually). The bootstrap uses official scaffolders for Astro and Appwrite rather than a custom framework generator.

## Repository

```text
apps/web/             One Astro application (public, Creator Studio, Admin routes)
backend/
  appwrite/            Appwrite-owned resource contracts and desired schemas
    functions/         Independently deployed Go Appwrite Function targets
    tables/            TablesDB desired schema
    documentsdb/       DocumentsDB design
    vectorsdb/          VectorsDB design
    storage/            Storage bucket design
    teams/              Team/role design
    topics/             Messaging topic design
    firewall/           Firewall policy design
  cloudflare/          Cloudflare platform boundary; generated internals are scaffold-owned
packages/
  domain/              Shared domain types and invariants
  appwrite-client/     Shared Appwrite client factories
  ui/                  Shared Svelte UI primitives
  config/              Shared environment/config contracts
agents/                17 agent specifications/manifests
contracts/             Canonical machine-readable behavioral contracts
tests/                 Contract, integration, E2E and determinism tests
docs/                  Human-readable decisions, procedures and rationale
scripts/               Bootstrap and validation helpers
```

## Official documentation

Appwrite setup and schema guidance is documented in `docs/APPWRITE_SETUP.md` and `docs/APPWRITE_SCHEMA_CONTRACT.md`. Technology pins are not certified as latest stable until the dated registry is completed; see `docs/architecture/TECHNOLOGY_FRESHNESS_AND_VERSION_LOCK.md`.


## Keep2Share Import Agent

The V1 Keep2Share Import Agent can discover Keep2Share links from an authorized source page, authenticate through a secret/session capability, download authorized files, normalize metadata, securely inspect and normalize archive members, and import the resulting assets through the canonical Appwrite-origin media pipeline. It must not bypass CAPTCHA, MFA, paywalls, access controls or download restrictions. See `docs/KEEP2SHARE_IMPORT.md`.

## V1 contract
The authoritative functional release contract is `docs/V1.md`. The coding agent must complete every V1 acceptance test before considering the application done.


## AI execution

The V1 architecture supports StoryGalore-funded AI credits and BYOAI. BYOAI covers cloud credentials and user-hosted inference endpoints; see `docs/AI_BYOK.md`.

## Dynamic configuration

Business policies and operational feature configuration are hot-reloadable at runtime. See `docs/DYNAMIC_CONFIGURATION.md`. Environment variables are reserved for infrastructure/bootstrap configuration and are not the source of truth for product policy.

## Shared Notification System

The shared Notification Service contract covers the in-app inbox, preferences, Appwrite Realtime updates, registered Appwrite Messaging adapters, and Cloudflare Workflows for durable delivery. It separates read state from per-channel delivery state and blocks unverified providers/policies. See `docs/NOTIFICATION_SYSTEM.md`. The repository update is a specification/validation change; it does not claim a deployed runtime or verified external provider.

## Community & Messaging V1

Comments and direct messaging are first-class capabilities. See `docs/COMMUNITY_MESSAGING.md`, `docs/UI_COMMUNITY_SCENARIOS.md`, and `contracts/community/`.


## V17.5 Creator Studio

V17.5 adds deterministic Creator Studio and Comic Editor contracts. See `docs/CREATOR_STUDIO.md`, `docs/COMIC_EDITOR.md`, `contracts/studio/`, `contracts/state-machines/studio.yaml` and `tests/contracts/studio-scenarios.json`.


## Durable execution (canonical V19.5.4+)

Cloudflare Workflows is the sole V1 durable workflow engine. Appwrite Functions handle synchronous requests, webhooks and scheduled entry points; they do not run a second durable job engine. Historical V18.1 material is retained for decision history only and is superseded by `docs/history/releases/V19.5.4_IMPLEMENTATION_HANDOFF.md` and the current execution contracts.

## V18.0 Secondary Media Distribution

Cloudflare is PRIMARY, Bunny is SECONDARY, and Appwrite Storage remains the canonical origin. SECONDARY is runtime-configurable and can be disabled by authorized administrators. See `docs/history/releases/V18.0_SECONDARY_MEDIA_DISTRIBUTION.md`.

## V18.4 — Social Core

V1 social capabilities are defined deterministically under `contracts/social/`, including creator profiles, follows, following feed, posts, reactions, comments/replies, mentions, notifications, collections, sharing, polls, block/mute/report, moderation, 1-to-1 messaging and subscriber-only social content. See `docs/history/releases/V18.4_SOCIAL_CORE.md` and `docs/AGENT_SLICE_55_SOCIAL_CORE.md`.

## V18.6 — Internationalization, RTL & Language-Aware Media

Internationalization is a V1 requirement. UI locale is independent from content-language preferences. Users can select `ONLY_SELECTED` language filtering for discovery/search/feeds/collections/recommendations. Publications carry canonical BCP 47 language metadata and approved localized editions. RTL is derived from locale metadata and implemented with logical CSS properties. See `docs/history/releases/V18.6_INTERNATIONALIZATION.md` and `contracts/i18n/`.


## V18.8 — Coding Agent Execution Specification

V18.8 adds the implementation/execution layer required for deterministic autonomous coding. The agent must resolve every task to canonical contracts, implementation ownership, source paths, API/persistence/provider mappings, tests, and Definition-of-Done gates. Missing or ambiguous requirements are blockers. See `docs/history/releases/V18.8_CODING_AGENT_EXECUTION_SPEC.md` and `contracts/implementation/`.


## V19.2 Agent Implementation Kit

V19.2 defines a machine-readable implementation contract for all 17 V1 agents. Every agent has a manifest, input/output schemas, tool contracts, capability boundaries, delegation edges, approval rules, context policy, state/error behavior, implementation mapping, and test matrix. Missing or ambiguous requirements are blocking conditions. The coding agent must instantiate the manifests and must not invent agent behavior outside the contracts.

## V19.5 — Deterministic Execution & Verification

V19.5 adds the global fail-closed determinism gate and closes the Appwrite Functions implementation contract. All 27 Appwrite Functions have explicit execution classes, typed I/O contracts, resource maps, secret policy, idempotency/retry rules, error catalog references and test matrices. The architecture now includes global coverage contracts for APIs, events, persistence, authorization, configuration, secrets, cache, providers, observability, accessibility, deployment, migration and disaster recovery.

Run `pnpm validate:docs` for documentation consistency, `pnpm validate:contract-syntax` for contract syntax, `pnpm validate:appwrite-functions` for the Function gate, and `pnpm validate:determinism` for the global no-guessing gate. Production promotion remains separately human-authorized.


## V19.5.2
Consumer economics, infrastructure cost attribution, unit economics, Admin economics dashboards, and scoped operational-agent observability are contractually registered.

## Canonical web deployment

StoryGalore uses one Astro web application at `apps/web`, deployed to one Appwrite Site. Astro SSR uses `@astrojs/node`; Appwrite Sites is configured with `framework: astro` and `adapter: ssr`. Public, Creator Studio and Admin are routes within this single application.

See `docs/V19.5.10_APPWRITE_ASTRO_SSR_SIMPLIFICATION.md` and `contracts/appwrite/sites/` for the deterministic deployment contract.


## V19.5.11 — Independent Route Authorization

Route groups are independently protected within the single Astro application. See `contracts/astro/routes.yaml`, `contracts/astro/route-protection.yaml`, and `contracts/security/authorization-completeness.yaml`. Astro middleware is an early gate only; authoritative backend commands, Appwrite Functions, Astro Actions/API endpoints, Agent tools, and MCP tools must independently enforce their registered capabilities. Missing route or capability mappings BLOCK implementation.

## Authorization status (V19.5.13)

The planned V1 route inventory, Admin RBAC registry, session runtime contract and authorization acceptance matrix are now specified. This does not mean all route files or runtime authorization code exist. See `docs/AUTHORIZATION_IMPLEMENTATION_HANDOFF.md`; implementation remains blocked until generated-route parity and applicable authorization acceptance tests pass.

## Technology versions

All languages, frameworks, adapters, SDKs, CLIs, and dependencies must be resolved to the latest stable compatible release from official sources immediately before implementation bootstrap. Exact pins and lockfiles are mandatory; the dated version lock is an implementation gate. See [Technology Freshness and Version Lock](./docs/architecture/TECHNOLOGY_FRESHNESS_AND_VERSION_LOCK.md). Run `pnpm validate:technology-freshness`.


## V19.5.15 — Repository consolidation

Appwrite-owned desired resource definitions live under `backend/appwrite/`. Cloudflare platform-owned runtime targets are under the `backend/cloudflare/` ownership boundary; their generated internals must be created by the pinned official Wrangler scaffolder. No generic `examples/` directory is retained; approved production integrations belong under their platform boundary, while illustrative guidance belongs in `docs/`. Historical change manifests live in `docs/history/change-manifests/`.

Run `pnpm validate:repository-coherence` to check workspace roots, canonical resource paths, active agent IDs, and retired placeholders. The technology version lock and dependency lockfile remain explicit bootstrap gates.

## Repository cleanup (V19.5.16)

The generic `examples/` directory has been removed. Keep authoritative behavior in `contracts/`, production code under the owning application/platform boundary, and explanatory material in `docs/`. Run `pnpm validate:repository-coherence` to prevent the examples directory from returning.


## V19.5.19 — Per-run latest-stable technology resolution gate

Historical release notes are grouped under `docs/history/releases/`; previous release manifests are under `docs/history/change-manifests/`. The current change manifest is `V19.5.19_CHANGE_MANIFEST.yaml`. The documentation index is `docs/README.md`.

Run `pnpm validate:repository-coherence` and `pnpm validate:docs` after changes. Latest-stable technology verification, the exact dependency lockfile, platform-native scaffolding, and runtime implementation remain explicit bootstrap gates.


V19.5.19 makes latest-stable technology selection a fresh per-bootstrap and per-release requirement. Prior resolution evidence is audit-only. Run `pnpm validate:technology-resolution` to verify the implementation gate; it intentionally remains blocked until official-source resolution, exact pins, lockfiles, and compatibility tests are complete.


Media catalog taxonomy and capability mapping: [`contracts/domain/media-catalog-taxonomy.yaml`](contracts/domain/media-catalog-taxonomy.yaml), summarized in [`docs/MEDIA.md`](docs/MEDIA.md).
