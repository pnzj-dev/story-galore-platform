# Change Impact Contract

Before changing a shared contract, determine:

- dependent packages and sites
- affected MCP tools
- affected workflows
- event producers/consumers
- policy decisions
- permissions
- UI journeys/states
- migrations and projections
- tests

The implementation must either update all affected contracts/tests or explicitly record a compatible migration path.

A lightweight executable analyzer is provided by `scripts/change-impact.mjs`.
