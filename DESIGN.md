# StoryGalore Design Contract

This file is the visual source of truth for the coding agent. The public product remains comics-first, but its discovery and creator experiences must accommodate images, posts, short video, long video, audio and mixed-media publications without introducing a second visual language. Reproduce the reference composition and interaction patterns shown in `docs/design-reference.png` while keeping all copy, artwork, metrics, and ad inventory data driven.

## Reference

- Visual reference: `docs/design-reference.png`
- Product direction: premium dark editorial comic platform.
- Public and admin share tokens and primitives, but not density or information architecture.
- Do not invent a second visual language without an explicit product decision.

## Global visual language

### Brand character

- Dark, cinematic, premium, creator-focused.
- Artwork is the visual hero; chrome stays restrained.
- Use luminous purple as the primary accent, with restrained secondary semantic colors.
- Use subtle borders, soft elevation, and large-radius surfaces rather than heavy shadows.
- Avoid gradients as decoration unless they support artwork or a deliberate hero treatment.
- Never use emoji as interface icons.

### Typography

- Use a clean modern sans-serif for interface text.
- Strong display hierarchy for public hero titles and series names.
- Dense but readable typography in admin tables.
- Use tabular/monospaced numerals for KPI values where supported.

### Shape

- Large rounded cards for public content and admin KPI/chart surfaces.
- Smaller radius for compact controls and table rows.
- Buttons are compact and confident; primary CTA uses the brand accent.

### Color tokens

Use semantic CSS variables/Tailwind tokens, not hard-coded values throughout components.

```text
background        near-black / deep navy
surface           dark elevated panel
surface-muted     slightly lighter dark panel
foreground        near-white
muted             cool gray
border            low-contrast cool border
primary           luminous purple
primary-strong    brighter purple for hover/focus
success           green
warning           amber
error             red
info              blue
```

Support dark mode as the default product presentation. Light mode may exist for accessibility/admin preference, but it must preserve the same semantic token system.

## Layout system

- Public content max width: approximately 1280px.
- Admin content max width: approximately 1600px on large screens.
- Use responsive gutters rather than fixed page padding.
- Public sections breathe; admin sections optimize information density.
- Never allow important controls to depend on hover only.

## Public route surface

### Global header

Desktop order:

```text
Logo | For You | Books | Videos | Art | Audio | Creators | Search | Sign in | Get started
```

Authenticated users additionally get Library, Create, notifications and avatar menu as appropriate.

Mobile uses a compact header with logo, search/menu, and profile actions.

### Homepage

Order:

1. Cinematic featured hero.
2. Four short product/value signals.
3. Trending Now horizontal media rail.
4. New/featured series.
5. Creator discovery.
6. Genre discovery.
7. Free-user advertising inventory where eligible.
8. Footer.

Hero composition:

- Large artwork occupying most of the hero.
- Left-aligned title, description and primary/secondary CTA.
- Avoid placing ads inside the hero.

### Cross-media discovery

Discovery is organized by media family rather than a single comics-first vocabulary. Books, videos, audio, art and creators are peer top-level families; formats (comic, manga, manhwa, manhua, bande-dessinée, novel, light novel, nonfiction; series, movie, short film, documentary) are subcategories within their family.

```text
For You | Books | Videos | Art | Audio | Creators
```

Use the following presentation patterns:
- Books: portrait cover cards; format is a badge (comic, manga, manhwa, manhua, bande-dessinée, graphic novel, webtoon, novel, light novel, nonfiction).
- Videos: landscape theater cards with duration and chapters; series, movies and shorts are subcategories.
- Shorts: portrait-first vertical feed cards with clear duration (nested under Videos).
- Audio: square cover-art cards with persistent mini-player.
- Images/Art: artwork-first gallery cards.
- Creator posts: editorial feed cards supporting mixed media.

Do not make the homepage look like a generic video/social network. StoryGalore is a creator-first media platform; comics remain a flagship format, not the only one.

### Comic/series cards

Each card may show:

- cover
- title
- creator
- rating/reaction summary where available
- readership indicator where policy permits
- compact genre/content tags

Adult content cards must use the platform's content-rating treatment and must never reveal restricted artwork to unauthorized users.

### Series detail

Use a split hero:

```text
cover | title / creator / metadata / description / actions
```

Below it:

```text
episodes | about | characters | gallery | comments/reviews
```

Episode list uses cover thumbnails, episode metadata, read action and entitlement state.

### Reader

The reader is immersive and separate from ordinary page chrome.

- Near-black canvas.
- Artwork is dominant.
- Controls appear on interaction and remain accessible by keyboard/touch.
- Bottom/side controls show progress, episode/page position, reader mode, comments, settings and fullscreen.
- Support paginated, vertical, horizontal, webtoon and strip modes.
- Page comments open as a side panel/overlay without destroying reading position.
- Do not expose original storage paths in UI.

### Creator UI

Use the same public visual language but with application-grade controls:

- project selector
- Story Bible
- Characters
- Worlds
- Assets
- Prompt Templates
- AI generation jobs
- draft/version editor
- publication workflow
- analytics

The AI workflow should feel like a studio, not a generic chat page.

### Pricing

Use three clear plan cards where plans exist. Explain entitlements rather than only price. Keep adult access and age requirements explicit. Ads are absent for paid plans that include an ad-free entitlement.

## Admin route surface

### Shell

Desktop:

```text
left sidebar | top utility bar | main content
```

Sidebar is dark, compact and icon-assisted. Main content is light-on-dark and card based.

Top utility bar contains search, notifications, environment/status where appropriate, and admin profile.

Mobile collapses the sidebar into a drawer.

### Admin overview

Above the fold, render an 8-card KPI grid:

```text
Active paid subscribers | MRR | New subscribers (30d) | Churned (30d)
Revenue (30d)          | Active readers | Published content    | AI cost/usage
```

Each KPI card includes:

- current value
- comparison period delta
- semantic trend indicator
- optional tiny sparkline when data exists
- link to the detailed section

Do not use a chart where a KPI counter is more readable.

### Admin charts

Immediately below the KPI grid, use three primary analytical charts:

1. Revenue and subscriber trend.
2. New vs churned subscribers.
3. AI generation usage and cost.

Additional insight panels:

- Top comics by readers.
- Reader demographics.
- Payment provider health.
- 24-hour platform activity.

Use line charts for ordered time series, bars for rankings/comparisons, and a donut/pie only for a small meaningful part-to-whole composition.

Charts must have:

- clear title
- concise explanatory subtitle
- selected period control
- tooltip values
- accessible text summary/table fallback
- empty/loading/error states
- consistent semantic metric formatting

Never use decorative charts that do not answer a business question.

### Admin navigation

```text
Overview
Analytics
Users
Creators
Comics
Moderation
Payments
Subscriptions
AI Operations
Ads & Monetization
Storage
Messaging
System
Settings
```

### Cross-media analytics

When media formats beyond comics are enabled, extend the admin analytics model without changing the overview KPI hierarchy. Add:

- content consumption by publication type
- video starts and completion quartiles
- average watch time
- audio starts/completions
- gallery opens and image progression
- cross-media conversion to subscription
- storage and delivery cost by media type

Use the same chart language and period controls as the primary dashboard.

### Analytics pages

Overview answers: "How is the platform doing?"

Analytics answers: "Why?"

Provide filters for date range, content type, series, creator, plan, geography where legally appropriate, device and payment provider where available.

### Tables

- Dense but readable.
- Sticky header where useful.
- Search, filters and saved views where useful.
- Row actions should be predictable.
- Destructive actions require confirmation.

## Advertising design

Advertising is a monetization feature for eligible free users, not the visual identity of the site.

### Eligibility

- Free users may see ads according to entitlement and campaign policy.
- Paid plans with `AD_FREE` do not see ads.
- Adult content must not receive arbitrary third-party ad creatives that violate the site's content rules or processor/advertiser restrictions.
- Do not expose ads to users who are not eligible for the surrounding content experience.

### Public placements

Define a finite inventory rather than letting campaigns inject arbitrary UI:

```text
HOME_FEED_BETWEEN_RAILS
DISCOVERY_FEED_BETWEEN_ITEMS
SERIES_PAGE_BELOW_HERO
SERIES_EPISODE_LIST_INLINE
READER_BETWEEN_EPISODES
READER_BELOW_COMIC
GENRE_PAGE_INLINE
```

Do not place display ads over comic artwork or inside an active comic page by default.

### Ad component

The ad renderer receives a placement and a server-selected creative. It must never contain provider-specific business logic.

```text
AdSlot
  -> eligibility
  -> campaign selection
  -> frequency cap
  -> creative render
  -> impression event
  -> click event
```

Support house ads and external ad-provider creatives through the same abstraction.

### Ad admin experience

`Ads & Monetization` gets its own admin section with:

```text
Overview
Inventory
Campaigns
Creatives
Placements
Targeting
Frequency Caps
Reports
Revenue
Provider Settings
```

Campaign workflow:

```text
Draft -> Scheduled -> Active -> Paused -> Completed / Archived
```

Campaign editor fields:

- name
- status
- advertiser/owner
- start/end time
- budget/impression/click limits
- creative(s)
- placements
- target plans/entitlements
- audience rules
- content-rating compatibility
- geography if legally permitted
- device/form factor
- frequency cap
- priority
- fallback/house-ad behavior

### Ad reporting

Show:

- impressions
- unique viewers
- clicks
- CTR
- fill rate
- estimated revenue
- eCPM where available
- campaign spend/budget
- frequency-cap hits
- placement performance
- device performance
- daily trend

Keep raw ad events append-oriented and aggregate reporting into daily metrics. Never calculate the admin dashboard by scanning all raw events on every request.

### Ad serving rules

Server-side selection should enforce:

1. user entitlement
2. campaign schedule
3. campaign status
4. placement compatibility
5. content-rating compatibility
6. frequency cap
7. budget/cap
8. targeting
9. priority
10. fallback house ad

Do not allow the client to decide whether an ad should be shown.

## Responsive behavior

### Public

- Desktop: cinematic wide layouts and horizontal rails.
- Tablet: reduce rail columns and hero height.
- Mobile: stacked cards, compact header, bottom reader controls, no horizontal overflow.

### Admin

- Desktop: sidebar + multi-column KPI/chart grid.
- Tablet: collapsible sidebar and 2-column cards.
- Mobile: 1-column cards, horizontally scrollable chart where necessary, tables converted to cards or controlled horizontal scrolling.

## Accessibility

- Keyboard navigable.
- Visible focus state.
- Reduced-motion support.
- Semantic headings.
- ARIA labels only where semantic HTML is insufficient.
- Chart summaries/fallback data tables for important analytics.
- Never communicate state through color alone.

## Implementation constraints

- Tailwind is the default styling mechanism.
- Bits UI supplies interactive primitives.
- Lucide supplies icons.
- Scoped CSS is allowed for bespoke artwork/reader composition.
- Public and admin must import shared primitives from `packages/ui`.
- Do not duplicate buttons, dialogs, forms, charts, cards or tokens between sites.
- All dimensions, colors and typography must come from shared tokens where practical.
- All charts must be data-driven and use the shared chart component contract.
