# Event Contract Registry

## Envelope
```json
{
  "eventId": "uuid",
  "eventType": "domain.entity.action.v1",
  "occurredAt": "ISO-8601",
  "schemaVersion": 1,
  "tenantId": "...",
  "actorId": "...",
  "correlation": {"requestId":"...","traceId":"...","operationId":"...","workflowId":"..."},
  "data": {}
}
```

## Rules
- Events are versioned and immutable.
- Producers publish only after the authoritative domain transaction succeeds, using the outbox pattern.
- Consumers use an inbox/deduplication key and MUST be idempotent.
- Failed delivery goes to a DLQ with replay controls.
- Replays MUST preserve the original event identity and be observable.
- Events MUST NOT contain provider secrets, payment credentials, session tokens, raw private messages or unnecessary personal data.

## Core event families
`studio.*`, `identity.*`, `workspace.*`, `content.*`, `draft.*`, `publication.*`, `media.*`, `ai_generation.*`, `moderation.*`, `payment.*`, `subscription.*`, `entitlement.*`, `download.*`, `comment.*`, `message.*`, `support.*`, `analytics.*`, `ad.*`, `policy.*`, `deletion.*`, `operation.*`.


## Adult Content Display Contract
- Canonical rule: `docs/ADULT_CONTENT_DISPLAY_CONTRACT.md`.
- Adult display is opt-in and defaults to `DISABLED`. Paid entitlement and age eligibility are necessary but insufficient.
- Unknown/stale/unavailable preference fails closed.
- All search, discovery, recommendation, API, MCP, notification, deep-link, cache, projection, vector, download and offline surfaces MUST enforce the same server-side decision.
