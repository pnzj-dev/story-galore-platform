# State Machine Contract

A state machine answers **whether a transition is legal**. The Policy Engine answers **whether the actor may cause it**. Cloudflare Workflows executes durable work; it is not the source of truth.

Every transition declaration contains:
- `from`
- `event`
- `to`
- `guards`
- `effects`
- `invariants`

Terminal states are explicit. Illegal transitions are rejected with stable error codes. State changes are persisted atomically with required domain effects or via an explicitly modeled outbox transaction.

Machine contracts cover agent tasks, features, publications, AI generations, media processing, payments, subscriptions, moderation, drafts and workflow operations.
