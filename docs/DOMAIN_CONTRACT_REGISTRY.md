# Domain Contract Registry

| Domain | Authoritative records | Key invariants | Durable workflow |
|---|---|---|---|
| Identity/Auth | users, sessions, security events | actor identity is server-authoritative | no |
| Creator/Workspace | creators, workspaces, memberships | tenant isolation | no |
| Content | projects, series, publications, pages, assets | ownership + publication state | media processing when long-running |
| Game Catalog & Browser Runtime | game catalog entries, taxonomy references, immutable GameBuild versions, launch decisions | source attribution, rights, age/access policy, isolated untrusted-code execution, deny-by-default network, explicit release gates | scanning/review, runtime health, revocation and rollback |
| Creator Studio | studio projects, story bible, characters, worlds, comic documents/pages/panels/layers, editor operations | tenant-scoped, revisioned, non-destructive edits | AI generation/media processing/publication when long-running |
| Drafts | drafts, immutable revisions, sync sessions | no silent overwrite; server-accepted save only | repair/cleanup only |
| Reader | reading state | entitlement-aware access | no |
| AI | generation jobs, provenance, credit ledger | non-destructive; reserve/settle/refund | yes |
| Moderation | moderation cases/decisions | policy + audit | yes when long-running |
| Payments | payments, attempts, webhooks, ledger, reconciliation | webhook/reconciliation authoritative | yes |
| Plans | plans, plan versions | historical commercial terms are immutable | no |
| Subscriptions | subscriptions, subscription events | payment success != subscription active != entitlement | yes for repair/reconciliation |
| Downloads | authorization + generated export records | signed, entitlement-scoped access | heavy export may use Cloudflare Workflows |
| Community | comments/reactions/reports | content entitlement still applies | no |
| Messaging | conversations/messages/requests | recipient policy + idempotency | no |
| Support | tickets/escalations/knowledge | least-privilege projections | no |
| Analytics | event/aggregate projections | rebuildable; tenant-scoped | aggregation/backfill only |
| Advertising | campaigns/creatives/placements/events | eligibility server-side | scheduler/aggregation may be durable |
| Discovery | search/vector/recommendation projections | authorization after retrieval | rebuildable |
| Policy/Config | versioned config + decisions | fail-safe sensitive policies | no |
| Operations | operation records/audit/incidents | immutable evidence | selected repair/recovery workflows |

Every new field MUST declare owner, classification, nullability, lifecycle, indexing needs and deletion behavior before implementation.


## Adult Content Display Contract
- Canonical rule: `docs/ADULT_CONTENT_DISPLAY_CONTRACT.md`.
- Adult display is opt-in and defaults to `DISABLED`. Paid entitlement and age eligibility are necessary but insufficient.
- Unknown/stale/unavailable preference fails closed.
- All search, discovery, recommendation, API, MCP, notification, deep-link, cache, projection, vector, download and offline surfaces MUST enforce the same server-side decision.


## Subscription billing contracts

- `contracts/domain/payment-provider-capabilities.schema.yaml` — provider payment capabilities.
- `contracts/domain/subscription-renewal.schema.yaml` — renewal payment lifecycle.
- `contracts/subscription-billing-strategies.yaml` — native, merchant-managed and manual billing semantics.

## Media Storage & Distribution

The media implementation must satisfy the Appwrite-origin / Cloudflare-distribution contract. Appwrite is authoritative for media files and metadata; Cloudflare provides distribution, caching and edge controls. Validate `contracts/domain/media-*.schema.yaml` and `contracts/state-machines/media.yaml` before considering media complete.


## Creator Studio

- `contracts/studio/*.schema.yaml` defines the canonical Studio and comic-editor records.
- `contracts/state-machines/studio.yaml` defines Studio project and editor-session transitions.
- `docs/CREATOR_STUDIO.md` is the implementation contract.
- `docs/STUDIO_DETERMINISTIC_IMPLEMENTATION.md` defines bounded-context ownership, persistence, commands/queries, concurrency, geometry, media/AI integration, validation and publication snapshot semantics.
- `contracts/studio/persistence-mapping.yaml`, `commands.yaml`, `queries.yaml`, `permissions.yaml`, `events.yaml`, `editor-geometry.schema.yaml`, `validation.schema.yaml`, `publication-snapshot.schema.yaml`, `import-export.yaml` and `undo-redo.yaml` are mandatory implementation contracts.
- `docs/COMIC_EDITOR.md` is the deterministic editor contract.
- `tests/contracts/studio-scenarios.json` is the Studio E2E contract.
- UI components MUST NOT access Appwrite directly; mutations flow through domain/application services, authorization and Policy Engine checks.

## V17.7 Deterministic Implementation Pass
See `docs/DETERMINISTIC_IMPLEMENTATION_PASS.md` and `contracts/deterministic/` for canonical persistence, API, state, failure, and source-of-truth contracts across non-Studio domains.


## V17.8 Cross-Domain Contract Integrity
The canonical compatibility graph is `contracts/compatibility/contract-graph.yaml`. Command/event, persistence, MCP and UI mappings are checked by `scripts/validate-cross-domain.mjs`. Subscription state is canonical at `contracts/state-machines/subscription.yaml`; the deterministic subscription file is a synchronized compatibility view, not an independent source.


## V17.8 Cross-Domain Contract Integrity
The canonical compatibility graph is `contracts/compatibility/contract-graph.yaml`. Command/event, persistence, MCP and UI mappings are checked by `scripts/validate-cross-domain.mjs`. Subscription state is canonical at `contracts/state-machines/subscription.yaml`; the deterministic subscription file is a synchronized compatibility view, not an independent source.
