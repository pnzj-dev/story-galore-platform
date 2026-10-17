# Admin analytics dashboard

Analytics are split by decision context. The main admin dashboard should show the few counters that answer "how is the platform doing right now?" and link to deeper operational views.

## Admin overview: primary counters

Place these at the top of `/admin` as a responsive KPI grid:

1. **Active paid subscribers** — current active paid reader/creator subscriptions, with period-over-period delta.
2. **MRR / recurring revenue** — normalized recurring revenue from active subscriptions, clearly labeled by currency and excluding one-time payments unless explicitly included.
3. **New subscribers (30d)** — new paid subscriptions in the selected period.
4. **Churned subscribers (30d)** — subscriptions that became cancelled/expired in the selected period.
5. **Revenue (30d)** — successful captured payments less refunds where accounting policy defines net revenue.
6. **Active readers (30d)** — unique authenticated users with meaningful reading activity.
7. **Published comics / episodes (30d)** — newly published content in the selected period.
8. **AI generation spend/usage (30d)** — generation units and estimated provider cost; show margin impact when cost data is available.

The first row should prioritize subscriber/revenue health; the second row should cover audience/content/AI supply.

## Admin dashboard sections

### Revenue & subscriptions

Counters/charts:
- MRR
- gross payments
- refunds
- chargebacks/disputes
- new subscriptions
- renewals
- cancellations
- churn rate
- trial-to-paid conversion if trials exist
- ARPU
- processor success rate
- payment-method mix

### Audience

- DAU / WAU / MAU
- new registrations
- active readers
- returning readers
- reading starts
- completion rate
- average reading session
- pages viewed
- follows
- library adds

### Content

- published comics
- published series
- episodes released
- draft pipeline
- moderation queue
- reported content
- top series/comics by starts/completions
- page drop-off

### Creators

- active creators
- new creators
- creator retention
- creator-generated reading hours
- creator revenue attributed
- AI usage per creator
- top creators by configurable metric (never hard-code a single ranking metric as a product truth)

### AI operations

- generation jobs queued/processing/completed/failed
- generation units
- average generation duration
- estimated model cost
- cost per successful output
- regeneration rate
- moderation rejection rate

### Payments / provider health

For each provider:
- enabled/disabled
- health status
- authorization/payment success rate
- latency
- webhook lag/failure count
- refunds
- chargebacks where available
- volume and currency

Do not automatically retry every declined card across processors. Route only eligible technical/provider failures according to the payment policy.

## Analytics data model

Keep raw behavioral events separate from aggregate counters. Raw events are append-oriented and server-ingested; aggregate tables are optimized for dashboard queries.

Recommended aggregates:

- `platform_metrics_daily`
- `subscription_metrics_daily`
- `content_metrics_daily`
- `creator_metrics_daily`
- `payment_provider_metrics_daily`
- `ai_metrics_daily`

Use a `metricDate` + dimension keys as the natural idempotency key for daily aggregation.

## Counter freshness

- Overview counters: target near-real-time or <= 5 minutes where practical.
- Financial/accounting counters: prefer reconciled values and label provisional data clearly.
- Daily historical metrics: compute by scheduled aggregation functions.
- Provider health: near-real-time checks and latest status.

## Event taxonomy

At minimum record:

`impression`, `click`, `open`, `start_reading`, `page_view`, `episode_complete`, `follow`, `library_add`, `reaction`, `comment`, `subscription_started`, `subscription_renewed`, `subscription_cancelled`, `payment_succeeded`, `payment_refunded`, `payment_chargeback`, `ai_generation_started`, `ai_generation_completed`, `ai_generation_failed`, `moderation_submitted`, `moderation_approved`, `moderation_rejected`.

Every event should include an event id, timestamp, actor/user when available, entity type/id when relevant, source/site, and a privacy-safe metadata envelope.


## Cross-media analytics

When additional publication types are enabled, aggregate consumption using the same platform event pipeline. Add `publicationType` and `mediaAssetType` dimensions where relevant.

Track: video starts, 25/50/75% milestones, completions, average watch time, audio starts/completions, gallery opens, image progression, content-type conversion to subscription, and storage/egress cost by media type.

Keep the executive overview focused on the existing eight KPIs; put these format-specific insights under Analytics > Content / Media.


## Consumer economics & infrastructure

The consumer economics views are defined by `contracts/analytics/consumer-economics-metrics.yaml` and `contracts/analytics/consumer-economics-dashboards.yaml`. They cover paid consumer revenue, media consumption, entitlement utilization, media delivery/storage/transcode costs, attributable infrastructure cost, contribution margin, cost per consumption unit, overage revenue, sponsored consumption and fair-use anomalies.

The Admin route surface must not infer cost from traffic volume or substitute zero for unavailable provider pricing. Cost state is always explicit.
