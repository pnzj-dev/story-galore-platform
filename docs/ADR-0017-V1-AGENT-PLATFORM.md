# ADR-0017 — V1 Agent Platform

## Decision

Ship the full StoryGalore agent family in V1 and expose external-agent interoperability from V1. Do not defer the previously discussed V1.5 agents.

## Why

The platform is designed around deterministic delegation, policy and contracts. Splitting the agent family into V1/V1.5 would create two incompatible operating models and encourage direct provider integrations.

## Runtime

Native agents use Cloudflare Agents. The Agent Gateway normalizes MCP, A2A-compatible transports and native RPC. External agents are untrusted execution participants until their identity, trust, scope, capabilities, expiry and policy decision are established.

## Engineering control plane

GitHub is the V1 engineering system of record. StoryGalore Support remains the customer-facing system. Support escalations become canonical GitHub Issues. Coding agents create isolated branches and PRs and terminate by default at `DEPLOYMENT_CANDIDATE`.

## Safety

No agent can grant itself capabilities, extend its scope, bypass the Policy Engine, expose secrets, or convert its own output into authoritative production state. CI/deployment systems remain authoritative for verification and deployment facts.
