# Machine Definition of Done

A feature is complete only when all applicable gates pass.

```yaml
feature:
  implementation: required
  domain_contract: required
  authorization: required
  tenant_isolation: required
  idempotency: required_for_mutations
  tests:
    unit: required
    integration: required
    e2e: required_for_user_flows
  ui:
    loading: required_when_async
    empty: required_when_collection
    error: required
    offline: required_when_editing_or_network_sensitive
    permission_denied: required_when_protected
  observability:
    correlation: required
    audit: required_for_sensitive_mutations
  documentation: required
  handoff: required

release_blockers:
  - fake payment success
  - client-only authorization
  - silent conflict overwrite
  - untracked destructive migration
  - secrets in logs/workflow history
  - dead UI action
  - untested critical failure path
```
