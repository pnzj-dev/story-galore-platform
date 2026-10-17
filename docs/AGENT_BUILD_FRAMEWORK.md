# Agent Construction Framework

StoryGalore is built by multiple specialized agents under explicit contracts. Agents must operate through the same loop: task -> context -> impact -> implementation -> validation -> handoff.

## Build loop

1. Claim a task from the implementation plan.
2. Load the task contract, ownership rules, relevant ADRs, and affected contracts.
3. Run the change-impact analyzer before editing shared contracts.
4. Implement only within allowed paths and capabilities.
5. Add/update unit, integration, contract, security, and E2E tests required by the task.
6. Run targeted validation, then all affected suites.
7. Run architecture/UI/policy validators.
8. Produce a machine-readable handoff containing changes, tests, risks, contract changes, and follow-ups.
9. A task is complete only when its Definition of Done is satisfied.

Agents must never claim completion based on compilation alone.

## Failure handling

Retries are bounded. Repeated failures are handed to the owning specialist or QA/SRE agent. Agents must not weaken tests, permissions, policies, or contracts to make a task pass.
