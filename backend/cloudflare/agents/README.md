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

Each agent runs as its own Appwrite user id `agent-{slug}` (labelled `agent` +
slug-with-hyphens-stripped, e.g. `agentstoryproducer`), never the admin service
account. The gateway resolves the actor's agent label and enforces the per-agent
operation allowlist (generated `backend/appwrite/functions/api/agent_auth.go`) at
dispatch, before any handler runs. Ownership checks in the read/mutate handlers
are skipped for agent actors because the allowlist is the authoritative
boundary.

The gateway derives the authoritative actor from the server-set
`x-appwrite-user-id` header (present when the function is invoked via a user
session JWT), overriding the body `actorId` claim. So a compromised agent cannot
impersonate another actor by changing its body claim.

Provision the agent actors before deploying:

```text
for each agent slug:
  1. an Appwrite user with id `agent-{slug}` and label `agent` + slug-with-hyphens-stripped
  2. a session for that user (users.createSession)
  3. a session JWT (users.createJWT), stored as the Worker secret AGENT_SESSION_JWT
```

When `AGENT_SESSION_JWT` is set the agent sends `Authorization: Bearer <jwt>`;
otherwise it falls back to the shared `APPWRITE_API_KEY` (local dev). The JWT
expires (max 1h via `users.createJWT`), so a refresh path is a follow-up
operational concern.

> The `contracts/agents/manifests/*.yaml` `implementation.source_path` /
> `tests_path` point at `backend/cloudflare/agents/src/agents/{slug}.ts` /
> `{slug}.test.ts`, matching this Worker. The capability registry
> (`contracts/agents/capability-registry.yaml`) is the complete canonical
> capability set (risk + scope) that the Policy Engine enforces.
