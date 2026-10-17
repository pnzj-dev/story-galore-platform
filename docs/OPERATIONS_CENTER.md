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
