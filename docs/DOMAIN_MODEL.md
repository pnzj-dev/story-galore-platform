# Domain Model

The platform is a creator media platform. Books are a publication type; comics, manga, manhwa, webtoons, and novels are formats/content structures. The core publication/media model remains media-agnostic.

## Identity

- User: Appwrite Auth identity.
- Profile: public/private application profile.
- Creator: creator-specific profile and settings.
- Team membership: collaboration role.
- Staff role: controlled by internal team membership and authorization.

## Content hierarchy

```text
Creator
└── Projects / Universes
    ├── Story Bible
    ├── Characters
    ├── Worlds
    ├── Assets
    ├── Prompt Templates
    ├── AI Generations
    ├── Drafts
    └── Publications
        ├── Series
        │   └── Volumes (optional)
        │       └── Episodes / Issues
        ├── Books (including supported comic formats)
        ├── Image collections (gallery presentation mode)
        ├── Creator Posts
        ├── Short Videos
        ├── Long Videos
        └── Audio
```

A creator project/universe can contain multiple media publications that share characters, worlds and story continuity.

## Media catalog taxonomy and canonical content model (V19.5.27)

The six user-facing families (`VIDEOS`, `SHORTS`, `BOOKS`, `IMAGES`, `AUDIO`, `GAMES`) are catalog/navigation families, not `Publication.type` or `MediaAsset.type`. Their canonical mapping lives in `contracts/domain/media-catalog-taxonomy.yaml`. The proposed publication types are `BOOK`, `POST`, `VIDEO`, `AUDIO`, and `MIXED`; changing persisted publication types still requires an approved migration. Ordinary media assets remain `IMAGE`, `VIDEO`, `AUDIO`, and `DOCUMENT`. Games are first-class catalog entities defined by `contracts/domain/game-catalog.schema.yaml`; browser builds are separate `GameBuild` artifacts defined by `contracts/domain/game-build.schema.yaml`, hosted by StoryGalore only after security review and explicit release approval. Neither a game listing nor a game build is a Publication or ordinary MediaAsset. Shorts remains a derived VIDEO view, Books map to BOOK only where the format/content contract allows, and publication archetypes are not automatically persistence enum values.

## Media model

`MediaAsset` is the canonical storage/processing abstraction. `Publication` is the canonical user-facing published content abstraction. Specialized content types reference media assets rather than inventing separate storage systems. `COMIC_PAGE` is not a media asset type: a comic page is an `IMAGE` asset whose ordering and reading semantics are owned by a `BOOK` publication with format `COMIC`. `IMAGE_GALLERY` is a presentation mode, not a publication type. `POST` is not a catch-all; archetypes may map to it only when the post contract supports their content structure and metadata.

```text
MediaAsset
├── type: IMAGE | VIDEO | AUDIO | DOCUMENT
├── mimeType
├── width / height (when visual)
├── durationMs (when cloudflare_workflows)
├── orientation: PORTRAIT | LANDSCAPE | SQUARE | UNKNOWN
├── aspectRatio
├── storageFileId
├── thumbnailFileId
├── previewFileId
├── processingStatus
└── metadata

Publication
├── type: BOOK | POST | VIDEO | AUDIO | MIXED
├── mediaAssetIds[]
├── projectId / seriesId / volumeId / episodeId
├── format / readingFormat / pageCount / pageWidth / pageHeight (book reading metadata)
├── content classification
├── access/entitlement rules
└── publication/version state
```

Do not encode `vertical video`, `horizontal video`, `short video`, and `long video` as separate top-level types. Orientation and duration are properties of a video asset.

Initial product phases:
- V1: books + images/galleries
- V1.x: creator posts/mixed media
- V2: short video
- V2.x: audio
- V3: long video
- V3+: cross-media AI generation

This roadmap is a product sequencing decision, not a reason to make the schema comic-only.


`seriesId` may be null for standalone books. `projectId` may group multiple publication types in the same universe.

## Game catalog and browser runtime

`Game` is a first-class catalog entity with source attribution, title, developers/publishers, release state, platforms, age/content rating, data-driven category/subcategory/genres, linked media assets and optional approved builds. It does not become a Publication. Game reviews and guides remain publications that reference a game ID.

A browser-playable build is a distinct `GameBuild`, not `MediaAsset.type = SOFTWARE_PACKAGE`. StoryGalore hosts approved WebAssembly, WebGL, or HTML5 bundles through a dedicated isolated, non-cookie-bearing game origin. Appwrite Storage remains the canonical file origin; a dedicated isolated runtime/serving layer is required and Cloudflare may distribute approved immutable files under the registered policy. External URLs or third-party iframes do not count as platform hosting.

All builds are untrusted code. Release requires rights verification, quarantine and scanning, immutable checksummed bundles, archive/path protections, an isolated sandbox, restrictive CSP, deny-by-default network policy, resource quotas, per-launch authorization, health checks, a kill switch, rollback, and cost metering. This contract defines requirements; it does not claim that the runtime is deployed.

## Classification

Never use one `genre` field as the entire classification system.

Independent dimensions:

- format
- genre
- audience
- publication status
- reading format
- origin/style
- content rating
- content origin
- tags

Example content rating values:

```text
ALL_AGES
TEEN
ADULT_18_PLUS
```

Example content origin:

```text
HUMAN
AI_ASSISTED
AI_GENERATED
HYBRID
```

## Versioning

A published work is immutable from the reader's perspective.

```text
Draft -> Revision -> Publication
```

Keep prior publications/revisions where business/legal requirements call for retention.

## AI generation

```text
AIRequest
  -> entitlement/policy
  -> execution planner
     ├── PLATFORM_CREDITS -> credit reservation
     └── BYOK -> authorized provider credential/endpoint
  -> AIJob
  -> generation outputs
  -> draft/revision
  -> review
  -> publication
```

Every AI output should preserve billing mode, execution location, provider/model, protocol, capability, usage/cost metadata and provenance.

User-hosted AI means inference executes on creator/user-controlled infrastructure outside StoryGalore. Provider/model capabilities are separate from provider identity.

## Comments

Page-level comments remain a comic-reader feature. For generic media, use `contentComments`/`publicationComments` semantics keyed to the published media item; keep the same flat parent-comment model.

Flat reply model:

```text
comments
id
pageId
userId
parentCommentId nullable
body
status
createdAt
updatedAt
```

Use moderation states such as `pending`, `published`, `hidden`, `deleted`.

## Download and offline

Download rights are explicit domain capabilities, not an implicit consequence of reading access.

```text
DownloadPolicy
├── publicationId
├── publicationVersionId
├── entitlementClasses[]
├── allowedModes: WEB_CACHE | APP_OFFLINE | EXPORT
├── allowedFormats: PDF | CBZ | EPUB
├── watermarkMode
├── maxDevices / limits
├── status
└── version / audit metadata

DownloadOperation
├── actorId
├── publicationId
├── publicationVersionId
├── entitlementId nullable
├── mode
├── format nullable
├── status
├── idempotencyKey
├── policyDecisionId
├── exportAssetId nullable
└── timestamps
```

`DownloadPolicy` is creator/publication policy; `Entitlement` is the user's access right. The Policy Engine combines them. Offline cache never becomes an independent entitlement source.

See `docs/DOWNLOAD_OFFLINE.md`.

## Commerce

```text
Plan
Subscription
Entitlement
Payment
PaymentAttempt
PaymentEvent
LedgerEntry
Refund
```

Provider-specific IDs live on payment records, not throughout the domain.

## Reader

```text
LibraryEntry
ReadingProgress
Follow
ReadingList
Reaction
```

Reading progress is keyed by user + publication (+ episode for episodic content).

The reader is book-agnostic and format-aware. Content structure is format-dependent: sequential-art books (comic, manga, manhwa, manhua, bande-dessinée, graphic novel, webtoon) read ordered image pages (`book_pages`); prose books (novel, light novel, nonfiction) use a chapter content model (blocked until approved). Book reading metadata (format, readingFormat, pageCount, page dimensions, episode) lives on the publication.

## Analytics

Record events separately from aggregates:

```text
impression
click
open
start_reading
page_view
episode_complete
follow
library_add
reaction
comment
subscription_started
subscription_renewed
subscription_cancelled
ai_generation_started
ai_generation_completed
```

## Moderation

A moderation record references content but does not mutate the canonical classification silently.

Store:

- case status
- reason/category
- automated signals
- human decision
- actor
- timestamps
- evidence references
- appeal state
