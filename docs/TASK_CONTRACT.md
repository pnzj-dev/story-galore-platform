# Task Contract

Every implementation task should be represented by a contract with at least:

- `id`
- `area`
- `goal`
- `owner_agent`
- `depends_on`
- `allowed_paths`
- `contracts`
- `required_tests`
- `acceptance`
- `forbidden_changes`
- `risk`
- `handoff_to`

Example:

```yaml
id: CREATOR-042
area: creator
goal: Implement draft recovery
owner_agent: creator
depends_on: [CREATOR-031, UI-018]
allowed_paths: [apps/web/**, packages/ui/**, packages/domain/**]
contracts: [domain/drafts, ui/draft-recovery]
required_tests: [unit, integration, e2e, security]
acceptance:
  - browser restart does not lose server-confirmed work
  - conflicts never silently overwrite
forbidden_changes:
  - payment permissions
  - authentication model
risk: medium
handoff_to: qa
```

Agents must refuse or escalate work outside their declared scope.
