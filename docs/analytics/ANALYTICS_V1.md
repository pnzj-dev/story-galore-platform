# StoryGalore V1 Analytics

Analytics is a cross-domain measurement layer for product, finance, marketing, creators, advertising, AI, community, support, and operations.

## Source-of-truth rule

Analytics is a rebuildable projection. It never decides whether a payment succeeded, an entitlement exists, a moderation action is valid, or a domain mutation is authorized.

Authoritative sources remain domain ledgers/records such as payments, subscriptions, entitlements, publication state, moderation state, and audit records.

## Event flow

Domain event -> versioned analytics event -> ingestion -> facts/projections -> daily aggregates/cohorts/funnels -> Admin/Creator/Agent views.

Analytics events must be privacy-minimized and must not contain secrets, credentials, session tokens, raw private messages, payment credentials, or unnecessary prompt content.

## V1 domains measured

1. Auth/account
2. Creator onboarding
3. Profiles/creators
4. Projects/story bible
5. Drafts/recovery
6. Publications/series/episodes/pages
7. Reader/reading progress
8. Library/follows
9. Comments/replies/reactions/mentions
10. Messaging
11. Search
12. Recommendations/discovery
13. Upload/media processing
14. Downloads/offline/exports
15. Moderation
16. Adult policy/eligibility (privacy-safe aggregates only)
17. AI generations/credits/BYOK
18. Payments
19. Subscriptions/entitlements
20. Advertising
21. Support
22. Notifications
23. Admin/operations
24. MCP operations
25. Cloudflare Workflows workflows
26. Security/abuse
27. Agent operations
28. Feature/config changes
29. Content acquisition/marketing attribution
30. Retention/cohorts
31. Creator revenue/payout reporting
32. Platform revenue/cost
33. Infrastructure/provider health

## Core event dimensions

- eventId, eventVersion, eventName, occurredAt
- actorType, actorId when permitted
- anonymousId when permitted
- tenantId/creatorId/workspaceId when permitted
- publicationId/contentId when permitted
- sessionId/device class/platform when permitted
- country/region only when lawful and needed
- acquisition source/medium/campaign/UTM when available
- plan/subscription state when permitted
- correlation: requestId/traceId/operationId/workflowId

## Core daily projections

- platform_metrics_daily
- revenue_metrics_daily
- subscription_metrics_daily
- payment_provider_metrics_daily
- acquisition_metrics_daily
- campaign_metrics_daily
- content_metrics_daily
- creator_metrics_daily
- audience_metrics_daily
- retention_metrics_daily
- advertising_metrics_daily
- ai_metrics_daily
- community_metrics_daily
- support_metrics_daily
- operations_metrics_daily
- mcp_metrics_daily
- workflow_metrics_daily
- security_metrics_daily

## Finance

Track gross revenue, refunds, chargebacks, provider fees, taxes when available, net revenue, recurring revenue, one-time purchases, MRR, ARR/run-rate, ARPU, LTV, churn, failed/recovered payments, revenue by provider/plan/channel/content where attribution is valid.

Finance definitions must reference the authoritative payment/subscription ledgers. Refunds and chargebacks update financial facts; analytics never fabricates financial success.

## Marketing

Track acquisition sources, first/last touch, UTM, referral, landing page, signup, verification, activation, first read, follow/library, subscription conversion, CAC inputs, campaign performance, cohort retention, and attributed revenue.

Attribution is versioned and must expose its attribution model in reports.

## Product/content

Track impressions, opens, reading starts, page views, completion, abandonment, reading time, follows, library adds, comments, reactions, downloads, offline activity, search impressions, recommendation impressions/clicks, and subscription conversion where valid.

## Creator analytics

Creators receive only their own tenant/workspace projections. Metrics include audience, content performance, engagement, downloads, acquisition, retention, attributed revenue, and AI usage/cost relevant to their workspace.

## Advertising

Track campaign, creative, placement, impression, unique viewer, click, CTR, fill rate, eCPM, frequency-cap hits, spend/budget where available, estimated revenue, and conversion attribution.

## AI

Track generations, capability, provider/model, success/failure, latency, retries, credits consumed, providerCost, storygaloreCost, creatorCreditCost, billingMode, executionLocation, and workflow outcomes. BYOK provider spend is separate from StoryGalore credit accounting.

## Support/community

Support: tickets, category, first response time, resolution time, SLA breach, reopen, escalation, and volume.

Community: comments, replies, reactions, reports, moderation outcomes, DM activity/request counts, blocks, and abuse reports. Do not store raw private-message content in analytics.

## Admin overview

The Admin Analytics Overview should answer within roughly 10 seconds: revenue health, subscription health, growth, activation, retention, content health, creator health, marketing efficiency, advertising, AI cost/usage, community/support load, payments, and operational health.

Detailed screens are defined in `contracts/analytics/admin-surface.json`.
