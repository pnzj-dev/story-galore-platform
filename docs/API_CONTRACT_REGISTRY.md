# API Contract Registry

## Request envelope
All mutation endpoints and MCP mutations SHOULD accept/support:
- `requestId`
- `traceId`
- `idempotencyKey` for externally visible mutations
- authenticated actor/session context
- tenant/workspace context when applicable

## Response envelope
Successful mutations return the authoritative resource/result plus `requestId`, and when asynchronous, `operationId` and initial status.

## Error envelope
```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Safe human-readable message",
    "retryable": false,
    "details": {}
  },
  "requestId": "..."
}
```
`details` MUST contain only safe, non-secret diagnostic fields.

## Required semantic error classes
`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_FAILED`, `RATE_LIMITED`, `ENTITLEMENT_REQUIRED`, `POLICY_DENIED`, `APPROVAL_REQUIRED`, `AGE_VERIFICATION_REQUIRED`, `PROVIDER_UNAVAILABLE`, `TEMPORARILY_UNAVAILABLE`, `BACKPRESSURE`, `WORKFLOW_FAILED`, `DEPENDENCY_FAILED`.

## Pagination
Collection APIs MUST use cursor pagination for potentially unbounded collections. Cursors are opaque. Clients MUST NOT infer database offsets from cursors.

## Async operations
Long-running work returns `operationId`; clients use status/result/cancel contracts where supported. Cloudflare Workflows workflow IDs MUST NOT be treated as client-visible business identifiers unless explicitly exposed through the operation projection.

## Authorization
The server evaluates identity -> tenant -> capability -> domain authorization -> Appwrite permissions -> object ownership -> projection filtering. Client UI state never substitutes for authorization.

## Compatibility
Breaking field/semantic changes require a new contract version or migration path. Unknown additive response fields MUST be tolerated by clients.


## Adult Content Display Contract
- Canonical rule: `docs/ADULT_CONTENT_DISPLAY_CONTRACT.md`.
- Adult display is opt-in and defaults to `DISABLED`. Paid entitlement and age eligibility are necessary but insufficient.
- Unknown/stale/unavailable preference fails closed.
- All search, discovery, recommendation, API, MCP, notification, deep-link, cache, projection, vector, download and offline surfaces MUST enforce the same server-side decision.
