# StoryGalore Native Agents (Cloudflare Agents SDK)

The V1 agent family runs as a single Cloudflare Worker hosting **17 native
agents** as Durable Objects on the Cloudflare Agents SDK. Each agent is
capability-guarded by the in-process Policy Engine and records provenance +
a `policyDecisionId` on every tool call.

## Generation

The runtime is generated deterministically from the agent contracts. Regenerate
after any change to `contracts/agents/manifests/*.yaml` or
`contracts/agents/tools/registry.yaml`:

```bash
pnpm generate:agents
```

The generator (`scripts/generate-agents.py`) emits:

- `src/manifests.ts` — simplified manifests (capabilities + delegation) for the Policy Engine.
- `src/agents/{slug}.ts` — one Durable Object agent class per agent.
- `src/env.ts`, `src/index.ts`, `wrangler.jsonc` — DO bindings + migrations.

Validate the reconciliation invariants (capability-registry completeness,
tool→manifest consistency, delegation targets, source paths):

```bash
pnpm validate:agent-capabilities
```

## Layout

- `src/index.ts` — `routeAgentRequest` entrypoint.
- `src/env.ts` — Worker `Env` (DO bindings + optional Appwrite gateway config).
- `src/policy.ts` — deterministic, fail-closed Policy Engine.
- `src/manifests.ts` — all 17 agent manifests (generated).
- `src/base-agent.ts` — `StoryGaloreAgent` base: capability assertion, provenance, gateway delegation.
- `src/agents/{slug}.ts` — the 17 agents (generated).

## Routing

`/agents/{kebab-class-name}/{instance-id}` — e.g. `/agents/story-producer/creator-1`,
`/agents/coding-dev/pr-1234`.

## Local dev

```bash
npm install
npm run dev
```

Runs without production Appwrite credentials; gateway-backed tools (reads and
mutations) fail closed with `GATEWAY_NOT_CONFIGURED` until `APPWRITE_ENDPOINT`,
`APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY` and `ADMIN_ACTOR_ID` are set (via
`wrangler secret put`). Compute tools (propose/review/advise/validate/…)
return a structured result with provenance + `policyDecisionId`.

## Policy model

Every tool call asserts its capability against the agent manifest via the
Policy Engine before any side effect, records provenance and a
`policyDecisionId`, and denies any capability outside the manifest's
`allowed`/`forbidden` sets. Unknown capabilities and out-of-allowlist delegation
are denied. Trust never substitutes for authorization.

## Gateway wiring

Read/mutate tools delegate to the `api` gateway function. The mapping of
capability → gateway operation lives in
`contracts/agents/tools/gateway-operations.yaml`; tools whose capability is not
mapped there fail closed (the generated method carries a `// fail-closed`
comment). Scope-sensitive admin/financial reads (`analytics.read`,
`cost.read`, `revenue.read`, `usage.read`, …) are intentionally unmapped until
per-agent credentials + gateway-side authorization exist, because agents
currently run as the admin service account.

> The `contracts/agents/manifests/*.yaml` `implementation.source_path` /
> `tests_path` point at `backend/cloudflare/agents/src/agents/{slug}.ts` /
> `{slug}.test.ts`, matching this Worker. The capability registry
> (`contracts/agents/capability-registry.yaml`) is the complete canonical
> capability set (risk + scope) that the Policy Engine enforces.
