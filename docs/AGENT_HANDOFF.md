# Agent Handoff Contract

Every completed task produces a handoff record:

```yaml
id: HANDOFF-...
task_id: CREATOR-042
from_agent: creator
to_agent: qa
status: ready_for_review
implemented: []
tests:
  passed: []
  pending: []
contracts_changed: []
files_changed: []
known_risks: []
follow_ups: []
blocked_by: []
```

Handoffs must distinguish verified facts from assumptions. Pending tests or known risks prevent a task from being marked production-ready.
