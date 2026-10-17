# Repository Audit — V19.5.20

## Scope
This audit records the Central Agent Gateway architecture decision and contract additions against V19.5.19. It is a repository/contract audit, not a runtime security certification.

## Changes
- Added exactly one `central-agent-gateway` entry to the Appwrite Function catalog (28 registered function contracts total).
- Added canonical function definition, request/response schemas, explicit resource-map blocker, and 20 required security acceptance cases.
- Declared one Appwrite Function as the gateway and an in-process Policy Engine module. A separately deployed policy service is prohibited without an approved ADR.
- Updated the Appwrite MCP connection contract and validator to enforce this decision.
- Added a decision document and release manifest.

## Before
```text
backend/appwrite/functions/
  function-catalog.json
contracts/integrations/
  appwrite-mcp-connection.yaml
  agent-appwrite-tool-allowlists.yaml
  appwrite-mcp-tool-registry.yaml
```

## After
```text
backend/appwrite/functions/
  function-catalog.json              # includes central-agent-gateway
contracts/functions/
  definitions/central-agent-gateway.yaml
  schemas/central-agent-gateway-input.yaml
  schemas/central-agent-gateway-output.yaml
  resource-maps/central-agent-gateway.yaml
  test-matrix/central-agent-gateway.yaml  # 20 cases
contracts/integrations/
  appwrite-mcp-connection.yaml       # canonical gateway decision
  agent-appwrite-tool-allowlists.yaml
  appwrite-mcp-tool-registry.yaml    # still blocked until captured
```

## Validation performed
- Appwrite MCP agent-access validation: PASS.
- Appwrite Functions contract/catalog parity: PASS (28 functions).
- YAML contract syntax: PASS (866 files).
- Repository coherence: PASS after updating the expected function count and current audit path.
- Direct validators declared in package.json: 32 passed; technology-resolution validator remains blocked by its existing unresolved latest-stable inventory, exact pnpm pin, and missing lockfile. This is an expected fail-closed blocker, not a gateway-specific regression.
- Documentation consistency: PASS (23 current documents/contracts).
- Authorization contracts: PASS (96 planned routes, 53 Admin mappings, 18 acceptance cases).
- No runtime/deployment test is implied.

## Outstanding blockers
- Unattended Appwrite MCP identity/delegation, token lifecycle, revocation, and least-privilege semantics are not verified.
- Official Appwrite MCP tool catalog has not been captured, hashed, and mapped.
- Canonical resource IDs for gateway policy, approvals, idempotency, audit, and tenant/domain authorization are not yet registered.
- Appwrite Go runtime support, exact compatible version, and execution/network/timeout limits require fresh official-source verification under the latest-stable policy.
- No official CLI-generated scaffold, gateway runtime, deployment, or live security test is claimed.
- The repository's broader latest-stable technology resolution and exact pnpm lock remain separate blockers.
