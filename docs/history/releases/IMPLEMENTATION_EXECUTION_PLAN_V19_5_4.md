# StoryGalore V19.5.5 — Deterministic Implementation Execution Plan

## Status

PLANNING ONLY. This document authorizes planning and verification work; it does not authorize application implementation, infrastructure provisioning, production deployment, provider activation, or production data mutation.

## Baseline

- Canonical release: V19.5.5
- Launch market: United States
- Operating entity: United States company
- Launch currency: USD
- International expansion: BLOCKED until an explicit jurisdiction pack is approved
- Canonical hosting: Appwrite Sites
- Canonical media origin: Appwrite Storage
- Primary media distribution: Cloudflare
- Secondary media distribution: Bunny, subject to registered failover contract
- Backend: Appwrite services
- Durable workflows: Cloudflare Workflows as the registered V1 execution engine
- Agents: Cloudflare Agents SDK

## Non-negotiable execution rule

CONTRACT EXISTS → FOLLOW IT  
EXPLICIT ALTERNATIVE → CHOOSE ONLY DECLARED ALTERNATIVE  
MISSING → BLOCK  
AMBIGUOUS → BLOCK  
UNKNOWN PROVIDER CONTRACT → BLOCK  
CONFLICT → BLOCK  
UNREGISTERED EXECUTABLE → BLOCK  
UNTESTED CONTRACT → BLOCK

## Scope of this plan

This plan converts the existing registries and dependency graph into an executable work queue. V19.5.5 durable-execution simplification is a mandatory normalization task before application implementation. It does not create new product behavior. Any discrepancy between this plan and a canonical contract is resolved in favor of the canonical contract and the plan becomes BLOCKED until regenerated.

## Execution gates

### G0 — Baseline normalization

Mandatory V19.5.5 normalization:

- The retired external durable-workflow runtime is absent from executable contracts, registries, source ownership, infrastructure maps, tests, and documentation.
- Retired payment-provider candidates are absent from payment registries, provider policies, adapters, routes, tests, and documentation.
- Cloudflare Workflows is the sole registered V1 durable workflow engine.
- WorkflowRunner remains provider-neutral; no application domain contract exposes provider-specific workflow identifiers.


Required before any implementation task:

- VERSION equals 19.5.4.
- Strict YAML duplicate-key validation passes.
- All V19.5.5 validators pass.
- Implementation maps have one unique key per registry entry.
- Every implementation task references canonical contract IDs.
- No task has an unresolved prerequisite.

### G1 — Repository/toolchain

Deliver only the repository/toolchain foundation defined by the implementation registry.

Required verification:

- pnpm/Turborepo workspace validation
- Astro 7/Svelte 5 compatibility validation
- package ownership validation
- TypeScript configuration validation
- lint/typecheck/test commands registered
- Appwrite Sites deployment target remains canonical

BLOCK conditions:

- alternative hosting introduced without a contract
- custom router introduced
- unregistered package boundary
- direct browser access to protected backend resources

### G2 — Domain kernel

Implement the canonical shared primitives and domain services before UI behavior:

- IDs
- money
- policy versions
- actors/capabilities
- immutable ledger primitives
- state machines
- idempotency
- operations
- canonical errors
- audit references
- entitlement primitives

Critical separation:

- money ≠ AI credits
- money ≠ consumption entitlement
- ledger balance ≠ available balance
- provider balance ≠ StoryGalore ledger

### G3 — Persistence and migrations

Implement registered Appwrite TablesDB/DocumentsDB/Storage resources only.

Every resource requires:

- schema
- ownership
- permissions
- indexes
- migration
- rollback strategy
- retention policy
- test fixture
- source-of-truth designation

No executable code may create an unregistered resource.

### G4 — Authorization

Implement capability/policy enforcement before protected commands are exposed.

Required coverage:

- user
- creator
- team member
- staff
- admin
- agent
- service identity
- provider webhook identity

Authorization failures must use canonical errors and produce audit records where required.

### G5 — API/Appwrite Functions

Implement registered Functions only.

Each Function must satisfy its manifest for:

- class
- entrypoint
- runtime
- input/output schemas
- auth
- capability
- resources
- permissions
- secrets
- redaction
- idempotency
- retry
- timeout
- concurrency
- lifecycle
- events
- audit
- observability
- tests
- deployment/rollback

### G6 — Financial and consumer economics

Implement in this order:

1. payment intent and settlement
2. immutable earnings ledger
3. creator reserves
4. refunds/chargebacks
5. revenue participation agreements
6. tax determination boundary
7. subscriptions/entitlements
8. consumer consumption metering
9. cost attribution
10. contribution margin
11. pricing lifecycle
12. promotions/gifts/referrals/bundles
13. payouts
14. stablecoin rail
15. wallet verification

Financial source-of-truth rule:

Provider → execution evidence → reconciliation → StoryGalore ledger.

Never provider balance → StoryGalore balance.

### G7 — Media

Implement media authorization and economic metering as one controlled flow:

request → authorization → entitlement → media policy → delivery authorization → delivery → metering → cost attribution.

CDN access must never bypass StoryGalore authorization.

### G8 — Public consumer UI

Astro-first.

Use Svelte only where genuine client interactivity/state requires it.

Required surfaces include:

- discovery
- story/content pages
- reader
- media players
- checkout
- subscriptions
- StoryPass
- account
- consumption/entitlement visibility

UI must consume registered APIs/actions and must not calculate financial policy.

### G9 — Creator Studio

Implement against canonical Studio contracts only.

Required guarantees:

- server-authoritative revisions
- explicit conflict handling
- IndexedDB recovery where registered
- non-destructive AI application
- publication validation
- immutable published snapshots
- capability-based authorization

### G10 — Admin control plane

Implement Admin as an operational control plane, not direct database CRUD.

Required domains:

- operations
- users/creators
- content/moderation
- payments
- payouts
- reserves
- tax
- economics
- providers
- agents
- configuration
- releases
- audit

Economic observability must include:

- revenue
- GMV
- creator payouts
- consumption
- infrastructure cost
- contribution margin
- plan profitability
- unit economics
- CAC/LTV where registered
- reserves
- refunds
- chargebacks
- tax liabilities
- pricing policy state

UNKNOWN must remain UNKNOWN; never coerce unavailable data to zero.

### G11 — Agents

Implement control-plane agents before domain-specialist agents.

Order:

1. Agent Orchestrator
2. Infrastructure
3. Coding/Dev
4. QA/Release
5. Cost Guardian
6. Data Analysis & Reporting
7. Support
8. Media Operations
9. Creator Business
10. Creator Growth
11. Discovery Curator
12. Reader Companion
13. Story Producer
14. Story/Continuity Guardian
15. Character
16. World
17. Art Director
18. Production
19. Community Guardian
20. Keep2Share Import
17. CEO

The order is a dependency preference; a task may only execute when its explicit registry prerequisites are satisfied.

### G12 — Provider integrations

Providers are adapters, never domain authorities.

Initial intended activation candidates:

- Stripe Connect for fiat/platform payments where its verified contract applies
- USDC/Base payout through an approved registered provider
- NOWPayments where its approved capability contract applies
- Coinbase Wallet / MetaMask / WalletConnect for supported wallet flows

Zen Payments and SecureGlobalPay remain non-active until provider contracts are verified and explicitly activated.

Unknown provider behavior → BLOCK.

### G13 — Verification

Every implementation slice must pass, in order:

1. contract validation
2. strict duplicate-key validation
3. typecheck
4. unit tests
5. state-machine tests
6. authorization tests
7. persistence/migration tests
8. API/Function tests
9. provider contract tests
10. agent contract tests
11. accessibility tests
12. visual regression
13. E2E
14. security checks
15. determinism validator

### G14 — Release candidate

Release candidate requires:

- all contracts closed
- all registered executables implemented or explicitly marked not executable
- all migrations tested
- all provider contracts activated or explicitly disabled
- all secrets classified
- all observability fields present
- all Admin critical metrics available
- disaster recovery test passed
- rollback test passed
- human release approval recorded

Production deployment is a separate explicit approval gate.

## Implementation task contract

Every generated work item must contain:

- `task_id`
- `title`
- `phase`
- `canonical_contracts`
- `depends_on`
- `source_ownership`
- `required_resources`
- `required_capabilities`
- `required_tests`
- `definition_of_done`
- `blocking_conditions`
- `approval_required`

A coding agent must refuse a task when any required field cannot be resolved from canonical registries.

## Prohibited behavior

- inventing schemas
- inventing routes
- inventing permissions
- inventing provider behavior
- silently selecting a provider
- silently selecting a jurisdiction
- silently selecting a tax rule
- silently changing pricing
- silently creating persistence resources
- silently changing creator economics
- silently changing consumer entitlements
- direct production deployment
- bypassing determinism gates

## Human approval gates

Explicit human approval is required for:

- commercial pricing activation
- tax policy activation
- provider activation
- stablecoin rail activation
- material commission changes
- entitlement changes with material margin impact
- production deployment
- migration execution against production
- emergency policy overrides

## Planning-only completion criteria

This planning phase is complete when:

- all contract registries have unique keys
- implementation graph is closed
- all work items have deterministic prerequisites
- all tasks map to canonical contracts
- all release gates are executable
- no task requires an undocumented business or technical decision
- a coding agent can execute the work queue without guessing

No application implementation is authorized by completion of this document.
