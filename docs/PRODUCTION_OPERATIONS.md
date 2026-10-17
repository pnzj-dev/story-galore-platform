# Production Operations Contract

## Environments
At minimum: local, staging, production. Environment secrets and data are isolated. Production credentials never appear in development artifacts.

## Migrations
Every schema/data migration MUST be forward-safe, observable, idempotent where possible, accompanied by rollback/forward-repair instructions and tested against a representative staging dataset.

## Rollback
Application rollback MUST be compatible with the persisted schema or use a coordinated migration. Never roll back code while leaving an incompatible destructive schema change unaddressed.

## Deploy gates
build -> typecheck -> unit/integration/E2E -> security/policy validation -> migration validation -> staging verification -> approval -> production -> post-deploy smoke -> monitoring.

## Hot policy/config
Policy/config changes are versioned and take effect without service restart. Sensitive stale caches fail closed/restrictively after their documented TTL.

## Observability
Every consequential request is correlated with requestId/traceId and, when durable, operationId/workflowId. Metrics exclude secrets and unnecessary personal data.

## Backpressure/degraded modes
Services MUST expose documented degraded states and admission control rather than exhausting dependencies under load.
