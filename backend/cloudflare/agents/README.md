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
- `src/agents/{slug}.test.ts` — per-agent authorization/contract tests.
- `src/env.ts`, `src/index.ts`, `wrangler.jsonc` — DO bindings + migrations.
- `backend/appwrite/functions/api/agent_auth.go` — the per-agent gateway allowlist.

Run the agent runtime tests (92 tests: per-agent authorization/contract + policy):

```bash
cd backend/cloudflare/agents && npm test
```

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
`APPWRITE_PROJECT_ID` and `APPWRITE_API_KEY` are set (via `wrangler secret
put`). Compute tools (propose/review/advise/validate/…) return a structured
result with provenance + `policyDecisionId`.

## Policy model

Every tool call asserts its capability against the agent manifest via the
Policy Engine before any side effect, records provenance and a
`policyDecisionId`, and denies any capability outside the manifest's
`allowed`/`forbidden` sets. Unknown capabilities and out-of-allowlist delegation
are denied. Trust never substitutes for authorization.

## Gateway wiring + per-agent authorization

Read/mutate tools delegate to the `api` gateway function. The mapping of
capability → gateway operation lives in
`contracts/agents/tools/gateway-operations.yaml`; tools whose capability is not
mapped there fail closed (the generated method carries a `// fail-closed`
comment).

Each agent runs as its own Appwrite user id `agent-{slug}` (labelled
`agent:{slug}`), never the admin service account. The gateway resolves the
actor's `agent:` label and enforces the per-agent operation allowlist (generated
`backend/appwrite/functions/api/agent_auth.go`) at dispatch, before any handler
runs. Ownership checks in the read/mutate handlers are skipped for agent actors
because the allowlist is the authoritative boundary.

Provision the agent actors before deploying:

```text
for each agent slug: an Appwrite user with id `agent-{slug}` and label `agent:{slug}`
```

The shared `APPWRITE_API_KEY` must be scoped narrowly (invoke the `api`
function only). Per-agent API keys that bind each Worker to its own actor are a
follow-up; until then the actor is passed as a claim and the allowlist is the
defense-in-depth boundary.

> The `contracts/agents/manifests/*.yaml` `implementation.source_path` /
> `tests_path` point at `backend/cloudflare/agents/src/agents/{slug}.ts` /
> `{slug}.test.ts`, matching this Worker. The capability registry
> (`contracts/agents/capability-registry.yaml`) is the complete canonical
> capability set (risk + scope) that the Policy Engine enforces.
