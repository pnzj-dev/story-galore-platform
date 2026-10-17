# ADR-0019 — Pin TypeScript 6.x (TypeScript 7 native port is incompatible with SvelteKit)

Status: Accepted

## Context

The workspace resolved `typescript@7.0.2` as the `latest` dist-tag. TypeScript 7 is the native (Go-based) compiler rewrite and no longer exposes the classic compiler API (`ts.sys`, `ts.readConfigFile`).

## Decision

Pin `typescript@6.0.3` (the latest 6.x stable) workspace-wide.

## Rationale

SvelteKit 3.0.1's `svelte-kit sync` — and the SvelteKit toolchain it drives (`svelte-check`, `@sveltejs/vite-plugin-svelte`) — still call `ts.readConfigFile(file, ts.sys.readFile)`, which is `undefined` in TypeScript 7.0.2. Scaffolding `apps/admin` fails at `svelte-kit sync` under TypeScript 7. The public Astro app and the standalone SvelteKit admin app share one TypeScript version, so a single compatible pin is required.

## Consequences

- `typescript` pinned at `6.0.3` in the workspace root and in `apps/admin`.
- The technology version lock records this as an `approved_exception` (latest overall is 7.0.2; selected is 6.0.3).

## Migration

Recheck when SvelteKit, `svelte-check`, and `@sveltejs/vite-plugin-svelte` adopt the TypeScript 7 compiler API; at that point re-resolve TypeScript to latest and remove this exception.
