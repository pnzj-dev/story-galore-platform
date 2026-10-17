# Reader Specification

## Modes

Support a common reader engine with mode adapters:

- paginated
- vertical
- horizontal
- webtoon
- strip
- mixed

## Cache

Use IndexedDB.

Cache by manifest/chunk:

```text
comic manifest
  -> chunk 0
  -> chunk 1
  -> chunk 2
```

Reader behavior:

- preload next chunk
- retain current chunk
- optionally retain previous chunk
- evict using an LRU-like policy
- respect plan/download entitlements
- never treat cached bytes as a separate authorization source
- expose offline/download actions according to the publication download policy

See `docs/DOWNLOAD_OFFLINE.md` for the normative download/export/offline contract.

Browser storage cannot be made absolutely inaccessible to a determined user. Treat this as application-managed caching, not DRM.

## Access

Before requesting protected page manifests or files:

```text
authenticated
+ entitlement
+ age/content checks
```

Use short-lived server-authorized access where needed.

## Progress

Persist:

- comic/episode
- current page
- scroll position
- completed
- last read timestamp
- device/session metadata only when justified

Sync across devices through Appwrite TablesDB.

## Page comments

Comments are attached to page IDs and support flat replies through `parentCommentId`.

Realtime can update the open comment thread.

## Performance

Prefer:

- responsive image variants
- lazy loading
- prefetch next chunk
- compressed page assets
- immutable content URLs
- minimal reader chrome


## Other media players

The comic reader is the flagship experience. Additional media should use shared playback primitives without forcing video/audio into the comic reader.

- Image gallery: lightbox/navigation, zoom and progression.
- Short video: portrait-first feed player.
- Long video: theater/fullscreen player with resume and chapters.
- Audio: persistent mini-player plus full player.

All players use the same entitlement engine, publication/media manifest service and analytics event pipeline.
