# StoryGalore UI Component Library Contract

## Purpose

`packages/ui` is the canonical shared UI system for the single Astro application at `apps/web`. Public, Creator Studio and Admin are route surfaces, not separate sites. This prevents parallel component implementations by independent coding agents and makes the UI scenario contract executable at component level.

## Technology

- Svelte 5 components
- Tailwind CSS for layout, typography, responsive behavior and standard states
- Bits UI for accessible interaction primitives
- Lucide Svelte for icons
- scoped CSS only for bespoke comic/reader composition

## Layers

```text
packages/ui
  primitives/   accessible building blocks
  composites/   reusable product compositions
  domain/       StoryGalore-specific components
  tokens/       semantic design tokens

apps/web -> @storygalore/ui
```

## Required component families

### Primitives
Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Dialog, Drawer, Popover, Tooltip, DropdownMenu, Tabs, Pagination, Avatar, Skeleton, Spinner, Toast, Alert, EmptyState, ErrorState, OfflineState, StatusBadge.

### Product composites
Header, Sidebar, Breadcrumbs, FilterBar, SearchBox, ContentCard, CreatorCard, MediaGallery, DataTable, MetricCard, ChartShell, UploadDropzone, AsyncButton, ConfirmationDialog, PermissionGate, EntitlementBadge.

### Domain components
ComicCard, SeriesCard, CreatorCard, ContentRatingBadge, AgeGate, DraftStatus, AutosaveIndicator, RevisionHistory, ConflictResolver, AssetUploader, ReaderToolbar, ReadingProgress, CommentComposer, ProviderSelector, ModelSelector, GenerationStatus, CreditMeter, SubscriptionCard, PaymentStatus, AdSlot, ModerationStatus, PolicyDecisionBadge.

## State contract

Reusable components must account for relevant states from `docs/UI_ROUTE_STATE_CONTRACT.md`: loading, empty, partial, saving, saved, offline, syncing, conflict, save_failed, processing, pending_review, restricted, age_required, subscription_required, permission_denied, unavailable, provider_unavailable, rate_limited, backpressure, retryable_error, permanent_error, removed and not_found.

## Accessibility

Every interactive component must expose an accessible name, keyboard interaction, visible focus, disabled semantics and appropriate ARIA state. Dialogs, menus, popovers and selects must use Bits UI rather than home-grown focus management.

## Data boundary

The UI package is presentation-only. It may consume typed view models and callbacks but must not fetch Appwrite data, contain route logic, own entitlements, or make authorization decisions. Server-authoritative decisions are passed in as state.

## Mutation rule

Never render a success state merely because a request was sent. Success is rendered only after the authoritative application service/Appwrite response is accepted. Payment success is only shown after webhook/reconciliation-backed entitlement state.

## Public vs admin

Use one component system with semantic tokens and density/layout composition. Do not fork the primitives for public/admin. Public uses cinematic/artwork-first compositions; admin uses dense operational compositions.

## Reader exception

The reader is a dedicated visual subsystem. It can use shared primitives but may use scoped CSS for page/canvas/overlay composition.

## Coding-agent rule

Before creating a reusable UI element, search `packages/ui`. Extend an existing component when the semantics match. A site-local component is permitted only when it is genuinely page-specific and non-reusable; document the reason when introducing a new pattern.
