# Cross-Domain Contract Integrity

V17.8 establishes the contract graph as the integrity boundary across domain state machines, commands, persistence, events, MCP and UI adapters.

## Canonicality
- One canonical state machine per domain.
- Subscription canonical source: `contracts/state-machines/subscription.yaml`.
- Deterministic subscription state machine is validated as a synchronized compatibility view.

## Graph
`UI/MCP → domain command/query → Policy/authorization → state machine → authoritative persistence → versioned event → projections/workflows`.

## Prohibitions
- No UI direct Appwrite writes.
- No MCP-specific business logic.
- No duplicate persistence resource definitions.
- No source-of-truth mutation without an event contract.
- No Cloudflare Workflows workflow treated as source of truth.

Run `pnpm validate:cross-domain` before merging domain changes.
