# Contract Registry

Canonical machine-readable contracts live under `/contracts`.

- `api/` HTTP/RPC request and response contracts
- `domain/` domain entities and invariants
- `events/` versioned event schemas
- `mcp/` MCP tool input/output and risk metadata
- `permissions/` capability and tenant authorization contracts
- `policies/` Policy Engine decision/config schemas
- `ui/` component, route-state, and scenario contracts
- `workflows/` durable workflow input/output and idempotency contracts

Generated types must be derived from canonical contracts where tooling supports generation. Agents must not create a second incompatible definition in application code.

## Community & Messaging

- `contracts/community/comments.yaml` — comment lifecycle and authorization
- `contracts/community/messaging.yaml` — conversation/message/request/block/report contract
- `contracts/mcp/community.yaml` — community MCP operation boundary
- `docs/COMMUNITY_MESSAGING.md` — product/security/runtime contract
- `docs/UI_COMMUNITY_SCENARIOS.md` — required UI journeys

## Media catalog taxonomy (V19.5.27)

- `contracts/domain/media-catalog-taxonomy.yaml` — canonical mapping between catalog families, proposed publication types, four ordinary media asset modalities, publication archetypes, categories/subcategories/genres, formats/capabilities, and migration gates.
- `contracts/domain/game-catalog.schema.yaml` — canonical first-class Game catalog entity and classification contract.
- `contracts/domain/game-build.schema.yaml` — separate StoryGalore-hosted browser game build lifecycle, security, runtime, and release contract. It explicitly does not treat executable builds as ordinary MediaAsset records.
- `docs/MEDIA.md` — human-readable overview; the YAML contracts are authoritative.

## Media Storage & Distribution

The media implementation must satisfy the Appwrite-origin / Cloudflare-distribution contract. Appwrite is authoritative for media files and metadata; Cloudflare provides distribution, caching and edge controls. Validate `contracts/domain/media-*.schema.yaml` and `contracts/state-machines/media.yaml` before considering media complete.


## Creator Studio contracts

- Studio schemas: `contracts/studio/`
- Studio state machine: `contracts/state-machines/studio.yaml`
- Studio implementation: `docs/CREATOR_STUDIO.md`
- Comic editor: `docs/COMIC_EDITOR.md`
- Studio AI: `docs/STUDIO_AI_WORKFLOW.md`
- Studio drafts/recovery: `docs/STUDIO_DRAFTS.md`
- Studio E2E: `tests/contracts/studio-scenarios.json`

## V17.7 Deterministic Implementation Pass
See `docs/DETERMINISTIC_IMPLEMENTATION_PASS.md` and `contracts/deterministic/` for canonical persistence, API, state, failure, and source-of-truth contracts across non-Studio domains.


## V17.8 Cross-Domain Contract Integrity
The canonical compatibility graph is `contracts/compatibility/contract-graph.yaml`. Command/event, persistence, MCP and UI mappings are checked by `scripts/validate-cross-domain.mjs`. Subscription state is canonical at `contracts/state-machines/subscription.yaml`; the deterministic subscription file is a synchronized compatibility view, not an independent source.


## V17.8 Cross-Domain Contract Integrity
The canonical compatibility graph is `contracts/compatibility/contract-graph.yaml`. Command/event, persistence, MCP and UI mappings are checked by `scripts/validate-cross-domain.mjs`. Subscription state is canonical at `contracts/state-machines/subscription.yaml`; the deterministic subscription file is a synchronized compatibility view, not an independent source.


## Internationalization

Canonical contracts: `contracts/i18n/`, `contracts/domain/publication-language.schema.yaml`, and `contracts/domain/user-language-preferences.schema.yaml`.


V18.7 addition: StoryGalore-managed AI credits are explicitly isolated from BYOK/user-hosted execution; media provider adapters include a dynamic Higgsfield catalog family.

## Business Model & Payment Economics

- `contracts/business/revenue-model.yaml` — canonical creator plans, StoryPass and revenue streams.
- `contracts/business/commission-policy.yaml` — deterministic commission calculation and attribution policy.
- `contracts/business/earnings-ledger.yaml` — creator financial ledger invariants.
- `contracts/business/payouts.yaml` — bank/USDC payout rails and settlement rules.
- `contracts/business/wallets.yaml` — registered wallet/network safety policy.
- `contracts/business/payment-provider-policy.yaml` — deterministic provider selection and activation policy.
- `contracts/business/marketplace-and-growth.yaml` — target marketplace, licensing, sponsorship and service revenue.
- `contracts/providers/payment-providers.yaml` — payment-provider adapter registry; CONDITIONAL providers are not production-routable.
- `contracts/verification/business-contract-to-test.yaml` — contract-to-test closure for economics and payments.

Business invariants: fiat-first customer checkout; USDC/Base preferred stablecoin payout; no proprietary token; creator-originated commerce receives lower declared fees; tips carry 0% StoryGalore platform commission; provider/network/tax costs remain separate; StoryGalore ledger is authoritative; unknown provider/rail/wallet capability blocks execution.

