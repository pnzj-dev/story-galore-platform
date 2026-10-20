# Download & Offline — V1 Contract

Downloading is a first-class StoryGalore capability. It must not expose source assets or bypass entitlement.

## Product principle

A user may receive a personal reading copy when the publication's policy and the user's entitlement allow it. A download grants a reading copy, not ownership of source assets, redistribution rights, or commercial rights.

## Download policy

Every published publication resolves a server-side download policy:

```text
NONE
OFFLINE_ONLY
DOWNLOAD_ALLOWED
DOWNLOAD_ALLOWED_WITH_WATERMARK
```

The policy is evaluated independently for each entitlement class:

```text
ANONYMOUS
FREE_USER
SUBSCRIBER
PURCHASER
CREATOR_OWNER
STAFF
```

Formats are capabilities, not assumptions:

```text
WEB_CACHE
APP_OFFLINE
PDF
CBZ
EPUB
```

A creator can disable downloads even when a user can read the publication. A paid entitlement does not automatically imply a downloadable file unless the commercial offer says so.

## Authorization decision

```text
identity
 -> global policy
 -> age/geography eligibility
 -> publication status
 -> content policy/moderation
 -> entitlement
 -> publication download policy
 -> requested format
 -> device/session/rate limits
 -> signed authorization
```

The browser must never decide whether a download is allowed.

## Storage security

Never expose the canonical Appwrite Storage file ID or unrestricted public bucket URL for protected content.

Protected delivery uses:

1. server-side authorization;
2. short-lived signed/authorized URL or authenticated streaming endpoint;
3. least-privilege storage permissions;
4. CDN caching only where authorization safety is preserved;
5. immutable published assets where possible.

Original/source assets are never downloadable through the reader's publication download path.

## Client-side playback & display deterrence

The player, image viewer, and reader render authorized media behind best-effort
client hardening, not DRM:

- `MediaPlayer` and `ImageViewer` accept a `guarded` prop that disables the
  native download control, picture-in-picture, right-click/long-press save, and
  drag-to-save.
- The reader renders image pages through `ImageViewer` (guarded).
- Cover thumbnails are marked non-draggable and non-selectable.

This deterrence stops casual save-as but does not prevent a determined user from
reading the delivered bytes (DevTools, network capture). The authoritative
control is the short-lived signed delivery URL for protected content; covers of
non-public publications are served through tokenized URLs too. Low-resolution
list-view cover thumbnails remain permanent by design.

## Export files

For PDF/CBZ/EPUB:

- export is generated from an approved immutable publication version;
- export identity includes publication version, format and policy version;
- existing ready exports may be reused when policy-compatible;
- expensive generation may run as a Cloudflare Workflows workflow;
- a simple already-existing file must not be sent through Cloudflare Workflows;
- export jobs are idempotent and resumable;
- generated export files have their own retention/lifecycle policy;
- creator/source files remain inaccessible.

## Watermarking

Where enabled, watermarking must be deterministic and auditable. The watermark may include a non-secret account identifier or purchase/reference marker appropriate to the privacy policy. Never embed passwords, provider keys, session tokens, or unnecessary personal data.

## Offline

Offline reading is application-managed caching, not DRM.

- IndexedDB is the client cache;
- cache by publication manifest and chunks;
- preload only what the current entitlement allows;
- retain current/next chunks and evict with an LRU-like policy;
- persist offline availability metadata;
- synchronize progress when connectivity returns;
- re-check entitlement according to the documented offline policy;
- if entitlement expires/revokes, stop new protected fetches and mark cached access according to policy;
- do not claim that browser storage prevents copying by a determined user.

## UX

The reader exposes one primary action whose label reflects the actual capability:

- `Read offline` for app-managed offline availability;
- `Download` when a file export is available;
- `Download PDF`, `Download CBZ`, etc. when multiple formats are explicitly allowed.

When unavailable, explain the reason without leaking protected policy details:

- Sign in required
- Subscription required
- Purchase required
- Age verification required
- Download unavailable for this publication
- Export processing
- Temporarily unavailable

A successful download is not shown until the server has authorized it and the client has confirmed receipt/registration of the download task.

## Library

The user's library includes a `Downloads` / `Offline` view with:

- publication title and thumbnail;
- format;
- downloaded size;
- status: queued, downloading, ready, paused, failed, expired/revoked;
- last sync/check;
- remove from device;
- retry;
- open in reader.

The creator's library/owner tools additionally show export history where appropriate.

## Analytics

Record:

- download_requested
- download_authorized
- download_denied
- download_started
- download_completed
- download_failed
- offline_added
- offline_removed
- export_requested
- export_ready

Analytics must not contain raw file URLs, signed URLs, access tokens, source assets, or unnecessary personal data.

## Abuse controls

Apply per-user, per-publication, per-device/session and global rate/size limits as appropriate. Repeated denied or abusive download attempts may trigger security/abuse policy without revealing internal thresholds.

## Agent/MCP rules

Agents must not retrieve protected publication bytes by bypassing the download authorization service. MCP download tools return an authorized operation or short-lived delivery reference, never storage credentials or permanent unrestricted URLs.

Recommended tools:

```text
publication_download_policy_get
publication_download_request
publication_download_status
publication_download_cancel
publication_export_request
publication_export_status
offline_entitlement_check
```

All mutations use idempotency keys and correlate `requestId`, `operationId`, `actorId`, `tenantId`, and `policyDecisionId`.

## V1 acceptance criteria

- A free user cannot download subscriber-only content.
- A subscriber can download only formats granted by the publication policy.
- A creator can export their own publication according to creator policy without receiving unrelated source files.
- A disabled publication cannot be downloaded even if an old UI state still displays a button.
- Expired/revoked entitlement cannot authorize a new protected download.
- Protected download URLs are short-lived and non-reusable beyond their authorization policy.
- Duplicate requests do not create duplicate paid export charges or inconsistent download records.
- Download/export failures are retryable without losing entitlement state.
- Offline cache never grants access that the server would deny for a new fetch.
- Download analytics contain no secrets or permanent protected URLs.
