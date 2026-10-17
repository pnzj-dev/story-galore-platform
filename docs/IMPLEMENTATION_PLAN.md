# Implementation Plan

## Phase 0 — Foundation

- [ ] Run the pinned official Astro CLI once to scaffold `apps/web`.
- [ ] Inspect and commit the generated Astro project structure.
- [ ] Add the official Astro Svelte integration to the single application.
- [ ] Register public, Creator Studio and Admin route surfaces and their explicit protection policies; do not scaffold separate applications.
- [ ] Establish pnpm workspace.
- [ ] Initialize Appwrite project with `appwrite init project`.
- [ ] Initialize official Appwrite resource definitions.
- [ ] Configure CI.
- [ ] Generate Appwrite types after schema exists.

## Phase 1 — Identity/security

- [ ] Auth pages and SSR session handling.
- [ ] Email verification/recovery.
- [ ] OAuth/passwordless methods selected for launch.
- [ ] Security settings.
- [ ] MFA.
- [ ] Profile/preferences.
- [ ] Labels.
- [ ] Teams and creator collaboration.
- [ ] Staff impersonation with audit.

## Phase 2 — Content

- [ ] Creator.
- [ ] Project.
- [ ] Story Bible.
- [ ] Character.
- [ ] World.
- [ ] Asset.
- [ ] Series.
- [ ] Volume.
- [ ] Comic/episode/issue.
- [ ] Pages.
- [ ] Draft/revision/publication.
- [ ] MediaAsset metadata and processing state.
- [ ] Cross-media Publication types.

## Phase 3 — Media foundation and reader

- [ ] MediaAsset and Publication abstractions.
- [ ] Image/gallery publication support.
- [ ] Creator posts/mixed media.
- [ ] Media processing state machine.
- [ ] Media storage variants and previews.
- [ ] Comic reader manifest.
- [ ] Chunked cache.
- [ ] Reading/progress.
- [ ] Page comments/replies.

## Phase 3B — Video/audio capability (feature-flagged)

- [ ] Short-video publication/player.
- [ ] Video orientation/duration metadata.
- [ ] Video processing/playback pipeline.
- [ ] Audio publication/player.
- [ ] Long-video theater mode.
- [ ] Playback analytics.
- [ ] Storage/egress cost dashboards.

## Phase 3C — Cross-media discovery

- [ ] Mixed-media creator feeds.
- [ ] Cross-media project/universe pages.
- [ ] Media-type discovery filters.
- [ ] Cross-media recommendations.

## Phase 3E — Storage/security hardening

- [ ] Provision media buckets with official Appwrite tooling.
- [ ] File/folder permissions for original and derived media.
- [ ] Upload initiation and direct-to-Storage flows.
- [ ] Image processing variants.
- [ ] Media preview/poster generation.
- [ ] Reader/player manifests.
- [ ] Chunked comic cache and offline entitlements.
- [ ] Cross-device progress.
- [ ] Page/publication comments and replies.

## Phase 4 — Commerce

- [ ] Plans and immutable plan versions.
- [ ] Dedicated subscription domain/table and state machine.
- [ ] Subscription lifecycle: activation, renewal, failed renewal, grace, cancellation, expiration and plan change.
- [ ] Entitlements.
- [ ] Payment abstraction.
- [ ] Provider adapters.
- [ ] Webhooks.
- [ ] Ledger.
- [ ] Reconciliation.
- [ ] Adult access gating.

## Phase 5 — AI

- [ ] Prompt builder.
- [ ] AI generation jobs.
- [ ] Credit ledger.
- [ ] Provenance.
- [ ] Generation progress realtime.
- [ ] Moderation pipeline.
- [ ] VectorsDB embeddings.

## Phase 6 — Discovery

- [ ] Keyword search.
- [ ] Semantic search.
- [ ] Trending.
- [ ] Recommendations.
- [ ] Creator discovery.
- [ ] Related series.

## Phase 7 — Operations

- [ ] Admin moderation.
- [ ] Payment/provider health.
- [ ] Audit log.
- [ ] Analytics.
- [ ] Messaging.
- [ ] Firewall.
- [ ] Feature flags.
- [ ] Backup/recovery runbooks.

## Phase 8 — Optimization

- [ ] Reader performance.
- [ ] Storage/bandwidth cost optimization.
- [ ] AI cost optimization.
- [ ] Payment routing optimization.
- [ ] Subscription conversion experiments.

## Phase 7A — Analytics dashboard detail

- [ ] Instrument the canonical event taxonomy in `docs/ADMIN_ANALYTICS.md`.
- [ ] Add daily aggregate tables from `backend/appwrite/tables/analytics-metrics.json` using official Appwrite provisioning.
- [ ] Add scheduled Go aggregation function(s) with idempotent date/dimension keys.
- [ ] Add near-real-time overview counter function for current paid subscribers, active readers and provider health.
- [ ] Build admin overview KPI cards with period selector and clear freshness/provisional labels.
- [ ] Build dedicated Revenue, Audience, Content, Creators, AI and Payments analytics views.
- [ ] Add exportable analytics views for staff where policy permits.
- [ ] Test aggregation against raw event fixtures and payment ledger fixtures.

- 15 — Subscriptions & provider-independent billing

## Media Storage & Distribution

The media implementation must satisfy the Appwrite-origin / Cloudflare-distribution contract. Appwrite is authoritative for media files and metadata; Cloudflare provides distribution, caching and edge controls. Validate `contracts/domain/media-*.schema.yaml` and `contracts/state-machines/media.yaml` before considering media complete.


## Phase 5A — Creator Studio and Comic Editor

- [ ] Implement Studio project/workspace-scoped application services.
- [ ] Implement Story Bible, Characters, World, Prompt Templates and Studio Asset references.
- [ ] Implement ComicDocument/Page/Panel/Layer/Text/Dialogue persistence contracts.
- [ ] Implement explicit reading-order persistence.
- [ ] Implement versioned editor operations with mutation idempotency.
- [ ] Implement editor autosave, IndexedDB offline queue, reconnect replay and conflict resolution.
- [ ] Implement Studio permissions through capability + Policy Engine checks.
- [ ] Integrate AI generation through the existing AI domain, credits/BYOK and provenance contracts.
- [ ] Implement non-destructive generation application to drafts.
- [ ] Implement publication validation, submission and scheduling.
- [ ] Pass all scenarios in `tests/contracts/studio-scenarios.json`.


## V17.6 Creator Studio deterministic contract gate
- Implement Studio only against `contracts/studio/*`, `contracts/studio/commands.yaml`, `contracts/studio/queries.yaml`, `contracts/studio/command-handlers.yaml`, `contracts/studio/persistence-mapping.yaml` and the Studio deterministic implementation documents.
- No direct Appwrite access from Studio UI.
- No silent last-write-wins.
- Published snapshots are immutable.

## V17.7 Deterministic Implementation Pass
See `docs/DETERMINISTIC_IMPLEMENTATION_PASS.md` and `contracts/deterministic/` for canonical persistence, API, state, failure, and source-of-truth contracts across non-Studio domains.

## V18.0 extension slice — Secondary Media Distribution

After the V1 freeze gate, implement the V18.0 distribution-resilience extension as `Agent Slice 52` using `docs/AGENT_SLICE_52_SECONDARY_MEDIA_DISTRIBUTION.md`. This slice is additive but breaking at the contract-manifest level and requires the V18.0 compatibility manifest and validators to pass.


V18.7 addition: StoryGalore-managed AI credits are explicitly isolated from BYOK/user-hosted execution; media provider adapters include a dynamic Higgsfield catalog family.
