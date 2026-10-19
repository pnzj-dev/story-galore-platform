# Admin Operations Center

## Navigation

Admin navigation includes:

- Operations Overview
- Platform Health
- MCP
- Cloudflare Workflows
- Workers
- Payments
- Failed Jobs
- Incidents
- Audit Events
- Alerts

## Operations Overview

Top status cards:
- overall platform health
- MCP health
- Cloudflare Workflows health
- Appwrite health
- payment-provider health
- worker health
- active incidents
- failed jobs

## Cloudflare Workflows

Show:
- task queues
- workers
- queued/running workflows
- workflow duration
- retries
- failures
- cancellations
- backlog
- oldest active workflow

Safe actions:
- inspect
- retry when workflow policy permits
- cancel when policy permits

## MCP

Show:
- request rate
- error rate
- p95 latency
- active clients
- tool health
- durable operation rate
- workflow backlog

## Incidents

An incident records:
- severity
- status
- startedAt
- resolvedAt
- affected subsystem
- summary
- owner
- related request/trace/workflow IDs
- timeline
- resolution
- post-incident notes

Incident changes are audited.

## Alerts

Alerts are configuration-driven. Examples:
- MCP error rate high
- MCP p95 latency high
- Cloudflare Workflows backlog high
- workflow failure spike
- payment provider degradation
- AI cost spike
- storage/processing failure spike

Do not hard-code thresholds in UI components.

## Alert evaluation

The alert evaluation engine (`alert_evaluate`) compares each enabled alert's
metric against its `operator` + `threshold` and, when triggered, records
`lastTriggeredAt`, opens an `incident`, and queues an admin `notification`
(type `ALERT`).

Evaluation runs two ways:

1. **Manual** — the Operations Center "Run evaluation" action calls the
   `alert_evaluate` gateway operation.
2. **Scheduled** — the `api` function has a cron `schedule` (`*/5 * * * *`).
   On a schedule trigger (`x-appwrite-trigger: schedule`), the gateway runs the
   evaluation directly as a trusted internal operation (no actor).

The schedule is configured on the `api` function (Appwrite Functions
`--schedule`), not via Cloudflare Workflows (whose cron is plan-gated).

## Metric ingestion

Built-in metrics are computed live from the domain tables (e.g.
`generation.pending`, `generation.failed`, `incidents.open`,
`domain_events.count`, `analytics_events.count`).

External metrics (MCP p95 latency, Cloudflare Workflows backlog, payment
provider health, etc.) are ingested into the `metric_points` table via the
`metric_ingest` gateway operation (`{metric, value}`). An alert whose `metric`
is not a built-in metric reads the most recent `metric_points` value.

## Notifications

Alert triggers write a row to the `notifications` table (`status: PENDING`).
Delivery through Appwrite Messaging (email/push/SMS providers) is a later
phase; the notification row is the source of truth a delivery worker consumes.
