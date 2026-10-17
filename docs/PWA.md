# Progressive Web App & Offline — Public Web Application

The public Astro application at `apps/web` is a Progressive Web App (PWA) with offline support.

## Scope

This contract covers the PWA shell for the public web application: installability, the service worker, and offline behavior for the application shell and public content. It does **not** replace the publication download/offline contract in `docs/DOWNLOAD_OFFLINE.md`, which governs protected publication assets and remains authoritative for entitlement.

## Requirements

1. **Web app manifest** — `name`, `short_name`, `id`, `start_url`, `scope`, `display: standalone`, `theme_color`, `background_color`, and icons (192/512 and maskable). Serve from the Appwrite Site with the correct `Content-Type`.
2. **Service worker** — a registered service worker that:
   - precaches the application shell (static assets, fonts, minimal UI);
   - uses **network-first** for SSR HTML so authenticated/protected pages are never served stale;
   - uses **cache-first** for immutable static assets and public images;
   - serves an **offline fallback** page when the network is unavailable and no shell entry is cached.
3. **Installability** — manifest + service worker + HTTPS; `standalone` display for an app-like experience.
4. **Entitlement boundary** — the service worker must **never** cache protected publication assets or grant offline access that the server would deny. Protected offline reading is delegated to the entitlement-gated IndexedDB cache defined in `docs/DOWNLOAD_OFFLINE.md` (`APP_OFFLINE` / `WEB_CACHE` modes).
5. **No sensitive caching** — authorization tokens, private data, and personalized SSR responses are never stored in the service worker cache.

## Caching strategy

| Resource | Strategy |
|---|---|
| SSR HTML (public pages) | network-first, fall back to shell |
| Static assets (JS/CSS/fonts) | cache-first, versioned by build |
| Public images (`astro:assets` / CDN) | cache-first |
| Protected publication assets | **never cached by the SW**; IndexedDB entitlement-gated cache only |
| API/action responses | network-only |

## Offline mode

- The offline fallback page and cached shell render when the network is unavailable.
- Reader offline content is served from the entitlement-gated IndexedDB cache, re-checking entitlement per `docs/DOWNLOAD_OFFLINE.md`; offline cache never becomes an independent entitlement source.
- Editor/creator and admin surfaces are **online-only** by default; any offline editing behavior must use the server-confirmed autosave and outbox contract in `contracts/clients/offline.json`.

## Tooling

The service worker is generated with a Vite/Workbox-based integration for Astro (resolved to the latest stable release at implementation time, per the technology-freshness policy). The manifest and service worker are committed artifacts with pinned versions.

## States

PWA and offline states follow `contracts/clients/offline.json` and `contracts/ui/states/page-state-contract.yaml`: `ONLINE`, `OFFLINE`, `SYNCING`, `CONFLICT`, `SYNC_FAILED`, and the `offline` UI state from `docs/UI_ROUTE_STATE_CONTRACT.md`.
