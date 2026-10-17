# V17.7 Deterministic Implementation Pass

## Purpose
V17.6 made Creator Studio deterministic. V17.7 applies the same standard to the other major domains so parallel coding agents do not invent persistence, commands, state transitions, or failure semantics.

## Covered domains
Reader, Entitlements, Payments, Subscriptions, AI, Discovery, Community, Messaging, Notifications, Analytics, Admin, Support, Publication.

## Required implementation order
1. Read the domain contract and applicable AGENTS.md/SKILL.md/DESIGN.md.
2. Read the deterministic persistence contract.
3. Read the API command/query contract.
4. Read the state-machine contract.
5. Apply Policy Engine authorization independently of state legality.
6. Implement source-of-truth writes before projections.
7. Emit versioned events through Outbox/Inbox.
8. Implement stable failure codes and retry semantics.
9. Add the domain scenarios before declaring the slice complete.

## Areas intentionally not treated as CRUD
Payments, subscriptions, entitlements, publication, AI generation, admin privileged actions, and support escalation contain financial, policy, or durable side effects. They require idempotency, reconciliation/repair where applicable, explicit state transitions, and auditability.

## Agent rule
If an implementation decision is not specified by the applicable domain contract, the agent MUST stop and report the ambiguity rather than silently inventing a new architecture when that decision affects source of truth, authorization, persistence, security, billing, or public API/event shape.
