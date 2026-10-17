# V19.5.16 Repository cleanup: remove examples

## Summary

This cleanup reconciles the repository with the current architecture without claiming implementation is complete. The canonical Appwrite-owned resource boundary is `backend/appwrite/`; the Cloudflare ownership boundary is `backend/cloudflare/`; no generic examples directory is retained. The web app remains `apps/web/` and the workspace now includes `apps/*` rather than the obsolete `sites/*` glob.

## Before (high-level)

```text
storygalore/
├── apps/web/
├── backend/
│   ├── functions/
│   ├── tables/
│   ├── documentsdb/
│   ├── vectorsdb/
│   ├── storage/
│   ├── teams/
│   ├── topics/
│   └── firewall/
├── packages/{analytics,appwrite-client,config,domain,ui}/
├── services/{mcp-cloudflare,posthog}/
├── contracts/ (canonical contracts; retired agent schema duplicates still present)
├── docs/ (active guidance and historical change manifests mixed together)
└── pnpm-workspace.yaml (incorrectly includes sites/*)
```

## After (high-level)

```text
storygalore/
├── .github/workflows/              # CI; requires frozen lockfile before build
├── agents/                         # Exactly 17 active agent manifests
├── apps/web/                       # One Astro SSR app; public/creator/admin routes
├── backend/
│   ├── appwrite/                   # Appwrite resource designs and 27 Function contracts
│   │   ├── functions/
│   │   ├── tables/
│   │   ├── documentsdb/
│   │   ├── vectorsdb/
│   │   ├── storage/
│   │   ├── teams/
│   │   ├── topics/
│   │   └── firewall/
│   └── cloudflare/                 # Platform ownership boundary; scaffold-owned internals
├── contracts/                      # Canonical behavior and implementation contracts
├── docs/
│   ├── adr/                        # Architecture decision records
│   ├── analytics/                  # Analytics docs
│   ├── architecture/               # Cross-cutting architecture policy
│   ├── history/change-manifests/   # Historical release manifests
│   ├── support/
│   └── ui/
├── packages/
│   ├── analytics/                  # Provider-neutral analytics target/specification
│   ├── appwrite-client/
│   ├── config/
│   ├── domain/
│   └── ui/
├── scripts/                        # Validators; no deployment force-push shortcut
├── tests/
├── docs/history/change-manifests/V19.5.15_CHANGE_MANIFEST.yaml
├── pnpm-workspace.yaml             # apps/* + packages/*
└── package.json
```

## Consolidations and removals

- Moved Appwrite resource definitions from `backend/<resource>/` to `backend/appwrite/<resource>/` and updated current source-path references.
- Removed the non-production Cloudflare MCP example directory; canonical integration contracts and the Cloudflare platform boundary remain. Example code is not needed in the deterministic production repository.
- Consolidated the PostHog service placeholder note into `packages/analytics/README.md`; no runtime analytics adapter is claimed.
- Removed eight byte-identical output-schema files for retired autonomous agent IDs (Character, World, Cost Guardian, Creator Growth). Their functionality remains represented by active owners/capabilities.
- Renamed retained Character/World tool contracts to Story Producer ownership, Creator Growth tools to Creator Business, and Cost Guardian tools to Data Analysis & Reporting. No retired agent ID is executable.
- Moved historical change manifests from the repository root and `docs/` into `docs/history/change-manifests/`.
- Removed the direct `appwrite push all --force` script to avoid bypassing deployment approval.
- Added `scripts/validate-repository-coherence.mjs` and `pnpm validate:repository-coherence`.

## Verified invariants

- One Astro application and one canonical Appwrite Site.
- Exactly 17 active agent directories.
- Appwrite Functions remain 27 independently registered targets, with Go required wherever Appwrite supports it.
- Cloudflare Workflows remains the sole V1 durable workflow engine.
- No direct force-push deployment script.
- No `examples/` directory is retained; production integration behavior remains specified by contracts and platform boundary docs.

## Still blocked (not papered over)

1. `pnpm-lock.yaml` is absent. CI now fails closed until an exact, verified dependency resolution is generated and committed.
2. `contracts/architecture/technology-version-lock.yaml` remains `bootstrap-required`; historical pins are not certified as latest stable.
3. Appwrite and Cloudflare generated scaffold output has not been created. The official pinned CLI/scaffolder must generate it at bootstrap. CI action references and the pnpm toolchain still need exact, evidence-backed pins as part of the same version-lock step.
4. The `apps/web` source remains a starter; route inventory parity and runtime authorization acceptance tests remain implementation gates.
5. Appwrite Function source implementations and Cloudflare Workers/Agents/Workflows implementations are not claimed to exist merely because contracts/catalogs are present.

## Validation commands

- `pnpm validate:repository-coherence`
- `pnpm validate:docs`
- `pnpm validate:contract-syntax`
- `pnpm validate:appwrite-functions`
- `pnpm validate:determinism`

Passing these checks validates repository/contract coherence, not production security or readiness.


## V19.5.16 follow-up

Removed `examples/cloudflare-mcp/` and all references that treated it as part of the repository layout. The Cloudflare MCP integration itself remains registered in the canonical integration/runtime contracts; only the illustrative sample files were removed. The coherence validator now rejects reintroduction of a generic `examples/` directory.
