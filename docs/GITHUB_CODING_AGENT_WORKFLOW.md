# GitHub-First Coding Agent Workflow

GitHub is the V1 engineering system of record. Do not add Jira/Linear/etc. merely to run coding agents. A provider-neutral adapter may be added later.

## Support escalation

1. User creates a StoryGalore Support Ticket.
2. Support Agent triages and classifies it.
3. Engineering escalation creates/links one canonical GitHub Issue.
4. Issue is transformed into a signed/scoped Agent Task.
5. Coding / Dev Agent receives the task.

## Coding task

The Coding / Dev Agent must inspect repository instructions including `AGENTS.md`, `DESIGN.md`, `SKILL.md` and applicable contracts before changing code. It must create an isolated branch named `agent/{taskType}/{taskId}/{short-slug}` from an approved base ref.

The agent must produce investigation, acceptance, changed-files, tests, validation, risk, deployment and provenance artifacts.

## Pull request

The PR starts as draft. It links the canonical issue and includes deterministic evidence. QA / Release may request changes or approve. The coding agent must not approve its own PR.

## Deployment

The normal endpoint is `DEPLOYMENT_CANDIDATE`, not production. Staging and production are separate capabilities. Production requires an explicit policy/approval decision and deployment-system evidence.

## GitHub adapter boundary

The adapter exposes normalized operations such as issue read/create/update, branch creation, repository read/write, PR creation/review, check/status retrieval and release evidence. Domain agents depend on these normalized contracts rather than GitHub SDK types.
