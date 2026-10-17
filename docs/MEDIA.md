# Media Platform Specification

## Canonical media concepts

StoryGalore distinguishes four concepts. They MUST NOT be collapsed into a single enum:

1. **User-facing media type** — the catalog/navigation family: `VIDEOS`, `SHORTS`, `BOOKS`, `IMAGES`, `AUDIO`, `GAMES`.
2. **Publication type** — the persisted user-facing publication structure: `BOOK`, `POST`, `VIDEO`, `AUDIO`, `MIXED`.
3. **Media asset type** — the stored/processed modality: `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`. A comic page is an `IMAGE` used in a comic-specific publication structure, not a distinct asset type.
4. **Format, capability, category, genre, and tags** — registered properties/data that refine presentation and discovery without creating accidental new persistence types.

The canonical mapping, status, restrictions, taxonomy examples, artwork policy, and explicit blockers are defined in [`contracts/domain/media-catalog-taxonomy.yaml`](../contracts/domain/media-catalog-taxonomy.yaml). That contract is authoritative if this overview and another document differ.

## User-facing catalog families

| Catalog family | Mapping and capability boundary |
|---|---|
| Videos | Maps to `VIDEO` publication/assets. Actual product exposure remains feature-gated according to the media lifecycle and release plan. |
| Shorts | A derived discovery/viewing surface over `VIDEO`; not a separate publication or asset type. Its duration threshold remains blocked until approved. |
| Books | A catalog family backed by `BOOK` where a registered book format/content structure is supported. Generic prose/ebook structures remain gated until their content contract is approved. |
| Images | `IMAGE` assets and collection/gallery presentation modes. An image asset or gallery layout is not automatically a publication. |
| Audio | Maps to `AUDIO` publication/assets. Audiobook and podcast-specific chapter/episode structures require registered contracts before those interactions are shown as available. |
| Games | A first-class game catalog entity. Browser-playable builds are separate `GameBuild` artifacts hosted by StoryGalore only after the registered review and runtime release gates pass. |

## Canonical publication type proposal (migration approval required)

```text
BOOK
POST
VIDEO
AUDIO
MIXED
```

The proposed canonical publication enum is `BOOK`, `POST`, `VIDEO`, `AUDIO`, and `MIXED`. This is a model change, not a claim that existing persisted data has been migrated. Do not replace these with the six catalog families or create `SHORTS` or `GAMES` publication types as a shortcut. Migration remains BLOCKED until data inventory, API/schema/lifecycle updates, authorization and analytics mapping, UI review, rollback plan, and explicit approval are complete.

`BOOK` owns the published work while a registered format such as `COMIC`, `MANGA`, `WEBTOON`, or `NOVEL` defines its content structure and reading behavior. `IMAGE_GALLERY` is a presentation mode for an image collection, not a publication type; the collection storage contract remains blocked until approved. `POST` uses the registered editorial/text body contract and is not a generic fallback; `VIDEO` and `AUDIO` represent playback-first publications; `MIXED` represents explicitly ordered heterogeneous content blocks. A comic page remains an `IMAGE` asset referenced by a `BOOK` publication with format `COMIC`.

They are deliberately not a complete list of user-visible publication formats. The extensive product-level registry is `publication_archetype_registry` in the canonical YAML contract. It covers editorial/community, fiction/text, comics/sequential art, image/visual, video/motion, audio/music, learning/reference, collections/mixed media, and game catalog/guides.

## Extensive publication forms and archetypes

StoryGalore may need to present many publication forms beyond the six persistence values. The canonical registry enumerates these forms, including articles, blog posts, news articles, reviews, interviews, essays, reports, newsletters, FAQs, devlogs, patch notes, stories, short stories, novels, chapters, poems, scripts, character/world/lore entries, fan fiction, comic issues, graphic novels, manga volumes, manhwa episodes, webtoons, comic strips, art books, photo essays, portfolios, infographics, memes, wallpapers, movies, TV episodes, trailers, teasers, clips, video essays, tutorials, music videos, documentaries, news bulletins, livestream recordings, tracks, albums, EPs, playlists, audiobooks, audiobook chapters, podcast episodes/series, audio dramas, music mixes, sound-effect packs, lectures, tutorials, guides, courses, lessons, quizzes, flashcards, worksheets, templates, slide decks, webinars, recipes, collections, anthologies, bundles, series pages, project showcases, resource packs, mixed-media stories, game listings, game reviews, game guides, walkthroughs, and mods.

**This registry is extensive, not a promise that every form is currently publishable.** Each archetype has an explicit mapping and status. Some may reuse an existing persistence type only when that type's schema and lifecycle support the required fields. Others remain blocked pending a domain contract. Do not add all these names to the `Publication.type` enum. A new persisted type requires a schema migration, API and lifecycle contracts, authorization, analytics mapping, UI/accessibility requirements, and migration/rollback planning.

A category such as `HORROR`, `ROMANCE`, `FANTASY`, or `EDUCATION` is a taxonomy value, not a publication type. A format such as `WEBTOON` or `AUDIOBOOK_CHAPTER` is an archetype/format and may require specialized structure. A media asset such as `IMAGE` or `AUDIO` remains a storage/processing type.

## Canonical media asset types (cleaned up)

```text
IMAGE
VIDEO
AUDIO
DOCUMENT
```

`MediaAsset.type` describes the underlying file modality, not how a file is used in a publication. The same `IMAGE` type can represent a cover, thumbnail, illustration, gallery image, or comic page. A comic page is identified by its relationship to an ordered `COMIC` publication content structure; page order, reading direction, and page-specific semantics belong to that structure, not to a second asset enum value.

`OTHER` is not a valid media asset or upload type. Unsupported or unknown media modalities must be rejected or explicitly modeled through a reviewed schema change, never silently accepted under a generic bucket.

`MediaAsset` remains the canonical storage/processing abstraction. `Publication` remains the canonical user-facing published-content abstraction. Specialized content structures reference media assets rather than inventing separate storage systems.

## Format and property rules

For video, orientation and duration remain properties:

```text
orientation = PORTRAIT | LANDSCAPE | SQUARE | UNKNOWN
durationClass = SHORT | MEDIUM | LONG
```

The exact duration boundary that qualifies a video for the Shorts catalog is not yet approved. Until it is registered, do not invent a threshold. Orientation alone does not prove that a video is a Short.

Do not encode vertical/horizontal/short/long video as separate persistence types. Do not assume a full ebook/audio chapter model exists because a catalog category is listed. Game catalog metadata is defined separately from game builds; browser play is platform-hosted but remains release-gated by the game-build security contract.

## Extensible categories and genres

Use the registered data-driven hierarchy:

```text
media type → category → optional subcategory → optional genre → optional tags
```

Stable IDs are canonical; translated labels are presentation. Examples in the taxonomy contract are non-exhaustive seeds, not a closed enum. Unknown categories must not be silently coerced to another category. Category creation, retirement, ordering, localization, and restricted visibility must use approved taxonomy governance contracts.

Examples include movies, TV shows, news, documentaries, anime, novels, comics, manga, manhwa, illustration, photography, audiobooks, music, podcasts, and game genres. These examples do not assert that every corresponding ingestion, publication, reader, player, or game-launch capability is implemented.

Adult/hentai categories remain blocked unless applicable legal, age, access, moderation, entitlement, and visibility contracts permit them. Restricted content must not leak through public discovery, previews, recommendations, or notification links.

## Reader/player and discovery experiences

- Comics: immersive page/vertical/webtoon/strip reader where the registered comic format supports it.
- Images: gallery/lightbox with keyboard/touch navigation where enabled.
- Shorts: feed-oriented player only when video playback is enabled; autoplay follows approved privacy/product policy.
- Long-form video: theater/fullscreen player, chapters, and resume only when supported.
- Audio: persistent mini-player and full player only when supported by registered playback capabilities.
- Mixed media: publication-defined ordered blocks.
- Books: use the comic reader for supported comic-like formats; a generic text/ebook reader is blocked until its content model is registered.
- Games: catalog detail by default. Approved browser builds are hosted by StoryGalore on an isolated non-cookie-bearing game origin. Launch requires an approved immutable `GameBuild`, explicit capability, per-request authorization, healthy runtime, and all release/security gates. WebAssembly/WebGL/HTML5 are accepted build targets, not trust boundaries.

## Artwork and UI recognition

Use `contracts/ui/artwork.yaml` as the shared artwork contract. Catalog cards require appropriate cover artwork, including a portrait cover where appropriate; media-specific landscape thumbnails, screenshots, or square audio art may also be used. Preserve source aspect ratio, support focal points/responsive sources, and use a registered fallback when artwork is missing. Use a registered media-type icon and do not rely on color alone.

## Cross-media project model

A Project/Universe may contain multiple supported publication types sharing characters, worlds, assets, and continuity. Do not assume that all six catalog families can already be authored or published from Studio.

## Product sequencing and capability gating

Existing phase guidance remains in force: books and images/galleries first, followed by creator posts/mixed media, short video, audio, and long video according to approved rollout and unit economics. The catalog taxonomy does not override feature flags, entitlements, provider contracts, or release approvals. Game catalog records are contract-defined; browser-playable builds remain disabled until the isolated runtime is deployed and each build passes review and explicit release approval.

## Monetization, analytics, and infrastructure

Media formats map to the existing entitlement system. Do not invent format-specific subscription systems. Analytics and infrastructure costs remain tied to the canonical publication/asset types and registered event properties; catalog family is an additional dimension only after it is mapped deterministically. Appwrite Storage remains the canonical media origin; Cloudflare provides distribution/edge controls under the existing authorization and lifecycle contracts.
