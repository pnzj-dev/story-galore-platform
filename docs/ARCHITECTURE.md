# Architecture

## Product boundary

The product is a creator media platform with books as its flagship publication type. The architecture is deliberately media-agnostic so the same publishing, entitlement, moderation, analytics, advertising and discovery infrastructure can serve images/galleries, creator posts, short video, long video and audio.

```text
Creator / Project / Universe
        ↓
Publication
  ├── Comic
  ├── Image Gallery
  ├── Post
  ├── Video
  ├── Audio
  └── Mixed Media
        ↓
Media Assets + Processing
        ↓
Access / Moderation / Discovery / Analytics
```

## High-level

```text
                    Appwrite Sites
                           │
                  One Astro + Svelte app
                  apps/web (SSR + prerender)
                           │
             Public / Creator Studio / Admin
                separately protected routes
                           │
                    shared packages
                           │
                  Appwrite Client APIs
                           │
        ┌──────────────────┼───────────────────┐
        │                  │                   │
     Auth/Teams         Data/Files        Messaging/Realtime
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
                    Appwrite Functions
                           │
             ┌─────────────┼──────────────┐
             │             │              │
        Entitlements   Workflows      Payments
             │        /Agents            │
             │             │       provider adapters
             └─────────────┴──────────────┘
```

## Data placement

### TablesDB

Use for transactional, relational, indexed application data:

- profiles
- creators
- projects
- series
- volumes
- publications
- media_assets
- comics/episodes/issues
- pages
- creator_posts
- comments
- subscriptions
- plans
- entitlements
- payments
- payment attempts
- ledger entries
- follows
- library
- reading progress
- reactions
- moderation cases
- audit events
- AI generation jobs
- usage/credit reservations
- AI provider connection metadata (never raw secrets)
- AI execution/billing metadata
- creator analytics aggregates

### DocumentsDB

Use for flexible, evolving JSON payloads where typed columns would become friction:

- story bible snapshots
- AI prompt configurations
- model/provider request payloads (sanitized)
- model responses/provenance extensions
- import/export manifests
- per-project generation settings
- feature configuration documents
- moderation evidence bundles
- provider capability snapshots
- BYOAI provider/endpoint capability snapshots
- webhook raw-event envelopes where payload shape varies

Do not use DocumentsDB to replace transactional TablesDB records.

### VectorsDB

Use for:

- comic/series semantic representations
- creator profile representations
- character/world semantic representations
- prompt/template retrieval
- recommendation candidates
- semantic search

Store only metadata needed to resolve the vector back to the canonical entity.

### Storage

Suggested buckets:

- `public-assets`
- `creator-assets`
- `pages`
- `media-originals`
- `media-previews`
- `media-downloads`
- `video-streaming`
- `audio-streaming`
- `ai-generation-output`
- `moderation-evidence`
- `exports`

Enable file-level security where per-file permissions are required. Use virtual folders to organize files by entity/version.

## Services

### Public route surface

Discovery, creator profiles, series/comic pages, image galleries, creator posts, short/long video playback, audio playback, comic reader, search, subscription entry points and account entry points. Books remain the flagship navigation/identity.

### Creator Studio route surface

Creator publishing, drafts, media, production tools, audience, earnings and account workflows. Each route uses its registered creator capability and resource-ownership policy.

### Admin route surface

Moderation, users, creators, payments, provider health, subscriptions, AI usage, reports, audit logs, feature flags and system configuration. Admin is a route surface in the same Astro application, not a separate Site. Each route requires an explicit capability mapping; there is no blanket admin grant.

### Appwrite Functions

Appwrite Functions are the synchronous/webhook/scheduled integration boundary. Durable asynchronous execution is delegated to Cloudflare Workflows; Appwrite Functions do not implement a second job runner.

## Realtime

Use Appwrite Realtime for:

- AI generation progress
- upload/processing progress
- comment/reply updates
- moderation queue updates for staff
- collaborative creator presence
- payment/subscription UI status where useful

## Notification Service

The Notification Service is a shared domain capability for the public experience, Creator Studio, and Admin. Its canonical contract is `docs/NOTIFICATION_SYSTEM.md`. Appwrite TablesDB owns inbox records, preferences, and delivery-attempt history; Appwrite Realtime updates only the authenticated user's UI; Appwrite Messaging is used through registered, verified adapters; Cloudflare Workflows is the sole durable delivery orchestrator. Appwrite Functions do not become a second job runner. Agents may request notification creation only through the Central Agent Gateway; clients and agents never send directly to providers. Read state and per-channel delivery state are independent.

## Messaging

Use Appwrite Messaging for:

- account verification/recovery
- sign-in alerts
- subscription receipts/status
- payment failures
- new episode notifications
- comment reply notifications
- creator generation completion
- moderation notices
- staff alerts

Use Topics for opt-in notification groups. Topic membership is not an authorization boundary. Notification provider contracts, consent policies, resource IDs, and delivery semantics must be verified before enabling external channels; see `docs/NOTIFICATION_SYSTEM.md`.

## Security boundary

The client can request an action; it cannot decide whether the action is allowed.

```text
Client
  -> authenticated request
  -> server authorization
  -> entitlement checks
  -> business invariant checks
  -> Appwrite operation
  -> audit/event
```


## User-hosted AI execution

StoryGalore supports user-hosted inference as an external execution target. The model runs on infrastructure controlled by the creator/user, not on the StoryGalore application host.

```text
StoryGalore AI service
        |
        +--> Cloud provider API
        |
        +--> User-hosted endpoint
                +--> Ollama / vLLM / LM Studio / LocalAI / ComfyUI / compatible adapter
```

The connector layer owns authentication, endpoint validation, health checks, model/capability discovery, timeouts, SSRF protection and tenant isolation. The core domain does not special-case individual models.

## V18.6 Internationalization and Language-Aware Media

Internationalization is a V1 cross-cutting capability. UI locale, user content-language preferences, publication language metadata, and localization editions are separate concepts. Content filtering supports `ALL` and `ONLY_SELECTED`; the latter is server-authoritative and applied before pagination. RTL is derived from locale metadata and UI layout uses CSS logical properties. See `docs/history/releases/V18.6_INTERNATIONALIZATION.md` and `contracts/i18n/`.
