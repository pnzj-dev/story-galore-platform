# StoryGalore Native Agents (Cloudflare Agents SDK)

V1 vertical slice of the StoryGalore agent family. This Worker hosts two native
agents — **Story Producer** and **Support** — on the Cloudflare Agents SDK to
prove the runtime, the in-process Policy Engine, and capability enforcement end
to end. The remaining 15 agents (`docs/AGENT_FAMILY_V1.md`) follow the same
`StoryGaloreAgent` base + manifest shape.

## Layout

- `src/index.ts` — `routeAgentRequest` entrypoint.
- `src/env.ts` — Worker `Env` (DO bindings + optional Appwrite gateway config).
- `src/policy.ts` — deterministic, fail-closed Policy Engine.
- `src/manifests.ts` — agent manifests (allowed/forbidden capabilities + delegation).
- `src/base-agent.ts` — `StoryGaloreAgent` base: capability assertion, provenance, gateway delegation.
- `src/agents/story-producer.ts`, `src/agents/support.ts` — the two agents.

## Routing

`/agents/{kebab-class-name}/{instance-id}` — e.g. `/agents/story-producer/creator-1`,
`/agents/support/ticket-1`.

## Local dev

```bash
npm install
npm run dev
```

Runs without production Appwrite credentials; gateway-backed tools
(`support.ticket.read`/`update`, `story-bible.read`) fail closed with
`GATEWAY_NOT_CONFIGURED` until `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`,
`APPWRITE_API_KEY` and `ADMIN_ACTOR_ID` are set (via `wrangler secret put`).

## Policy model

Every tool call asserts its capability against the agent manifest via the
Policy Engine before any side effect, records provenance and a
`policyDecisionId`, and denies any capability outside the manifest's
`allowed`/`forbidden` sets. Unknown capabilities and out-of-allowlist delegation
are denied. Trust never substitutes for authorization.

> The `contracts/agents/manifests/*.yaml` `implementation.source_path` /
> `tests_path` point at `backend/cloudflare/agents/src/agents/{slug}.ts` /
> `{slug}.test.ts`, matching this Worker. The capability registry
> (`contracts/agents/capability-registry.yaml`) is the complete canonical
> capability set (risk + scope) that the Policy Engine enforces.
