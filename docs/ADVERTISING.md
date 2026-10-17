# Advertising and monetization

Advertising is a first-class monetization subsystem for eligible free users. It must be server-selected, entitlement-aware, content-policy-aware, measurable, and manageable entirely from the protected Admin route surface in the single Astro application.

## Goals

- Monetize free readers without degrading the premium reading experience.
- Keep paid plans that include `AD_FREE` genuinely ad-free.
- Support house ads and one or more external ad providers behind one provider-neutral interface.
- Give operators control over inventory, campaigns, creatives, targeting, frequency caps, budgets, schedules and reporting.
- Keep advertising separate from payment processing: an ad provider is not a payment processor.

## Inventory

Initial placements:

- `HOME_FEED_BETWEEN_RAILS`
- `DISCOVERY_FEED_BETWEEN_ITEMS`
- `SERIES_PAGE_BELOW_HERO`
- `SERIES_EPISODE_LIST_INLINE`
- `READER_BETWEEN_EPISODES`
- `READER_BELOW_COMIC`
- `GENRE_PAGE_INLINE`

Avoid inserting display ads over an active comic page. The reader should remain immersive.

## Eligibility

The ad-serving function must evaluate:

- authenticated state when required by campaign rules
- subscription/plan entitlement
- `AD_FREE` entitlement
- age/content eligibility
- content-rating compatibility
- geography/device restrictions where lawful
- campaign schedule
- frequency cap
- budget/impression/click cap
- targeting rules

The client must not make the final eligibility decision.

## Provider abstraction

Use a provider-neutral interface:

```text
AdProvider
  getCreative(request)
  recordImpression(event)
  recordClick(event)
  health()
```

House ads should be implemented through the same interface or a first-party provider adapter.

## Campaign lifecycle

```text
DRAFT -> SCHEDULED -> ACTIVE -> PAUSED -> COMPLETED
                                  \-> ARCHIVED
```

## Admin workflow

`Ads & Monetization` should contain:

- Overview
- Inventory
- Campaigns
- Creatives
- Placements
- Targeting
- Frequency Caps
- Reports
- Revenue
- Provider Settings

### Campaign editor

Fields:

- campaign name
- status
- advertiser
- schedule
- priority
- budget
- impression cap
- click cap
- creative set
- placement set
- audience rules
- entitlement/plan rules
- content-rating compatibility
- geography/device targeting where permitted
- frequency cap
- fallback behavior

### Creative review

Creatives require moderation/status before activation. Store the actual asset in Appwrite Storage with controlled permissions; external provider creative IDs are metadata, not the source of truth when first-party hosting is used.

## Metrics

Raw events:

- `ad_impression`
- `ad_click`
- `ad_viewable_impression` when supported
- `ad_frequency_cap_hit`
- `ad_fill_miss`

Daily aggregates:

- impressions
- unique viewers
- clicks
- CTR
- fill rate
- estimated revenue
- eCPM where meaningful
- budget consumed
- cap hits
- placement performance
- campaign performance
- device performance

## Privacy

Use the minimum data necessary for targeting and reporting. Do not expose personal identifiers to third-party ad providers unless the applicable integration and privacy basis explicitly permit it. Prefer coarse, privacy-safe dimensions for analytics.

## Appwrite implementation

Recommended server functions:

- `ad-serve`
- `ad-event-ingest`
- `ad-campaign-scheduler`
- `ad-metrics-aggregate`
- `ad-provider-health`

Use Appwrite Storage for first-party creative assets, TablesDB for operational campaign/inventory data and daily aggregates, and Realtime/Messaging only for admin operational updates where useful.
