# StoryGalore Admin — Consumer Economics & Infrastructure Economics

## Purpose

The Admin route surface must make the consumer side of StoryGalore economics operationally visible. This surface is read-only by default and must never become a runtime dependency for public consumption.

## Executive dashboard — `/admin/economics`

Show, with period and currency context:
- consumer paid subscribers
- consumer ARPU
- consumer video/audio minutes
- consumer attributable infrastructure cost
- consumer contribution margin and margin rate
- cost per video minute
- cost per download GiB
- overage revenue

Every financial metric displays `ACTUAL`, `ESTIMATED`, `PROJECTED`, or `UNAVAILABLE`. `UNAVAILABLE` is never rendered as zero.

## Consumption — `/admin/economics/consumption`

Drill down by plan, media type, quality, country and date. Display entitlement granted, entitlement consumed, utilization rate, overage usage, fair-use throttles and anomalous concurrency.

## Media economics — `/admin/economics/media`

Display CDN delivery cost, origin egress, storage, transcode cost, cache effectiveness, provider, media type and quality. Provider costs must be tied to the registered provider-cost contract; unknown provider pricing is not invented.

## Plans — `/admin/economics/plans`

Compare revenue, payment costs, attributable infrastructure cost, contribution margin, utilization and churn by consumer plan. Plan activation or price changes are not editable from a generic dashboard; they require registered configuration/policy actions and declared approval.

## Unit economics — `/admin/economics/unit-economics`

Show cost per video minute, audio minute, download GiB, AI companion unit, and attributable active-user cost. Include included/excluded cost dimensions and reconciliation status.

## Anomalies — `/admin/economics/anomalies`

Show fair-use triggers, extreme concurrency, download velocity, repeated-asset loops, unexplained cost spikes and margin deterioration. Read-only diagnosis is separated from enforcement. Enforcement must use the registered policy engine and audit trail.

## Privacy

Dashboards use aggregate or authorized pseudonymous projections. Raw media payloads, private content, wallet secrets, payment credentials and unnecessary PII are excluded.
