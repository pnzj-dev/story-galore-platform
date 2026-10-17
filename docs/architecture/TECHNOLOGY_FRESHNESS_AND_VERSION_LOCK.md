# Technology freshness and version lock

## Normative rule

Every language, runtime, framework, adapter, SDK, CLI, build tool, package manager, test tool, and dependency used by StoryGalore must use the **latest stable release compatible with the approved architecture**, verified afresh for every implementation bootstrap and every release candidate, and re-resolved whenever the build plan or dependency graph changes. A prior resolution is historical evidence only; it never satisfies a later run.

"Latest" is time-dependent. A version written in an old planning archive is not proof that it is still latest. This repository therefore requires a dated, evidence-backed version lock instead of making unsupported claims that its current pins are latest.

## Required procedure

1. Identify every technology in scope, including tools used only by scaffolding, CI, tests, deployment, or code generation.
2. Check the official project's release page/changelog and official registry or vendor documentation. Record the URLs and UTC check time.
3. Select the newest stable release. Exclude alpha, beta, release candidate, preview, nightly, canary, and experimental versions.
4. Verify platform/runtime support and compatibility with the selected Appwrite Sites Astro SSR deployment, Appwrite Functions Go policy, Cloudflare Workers/Agents/Workflows/MCP boundaries, and all direct dependencies.
5. If latest stable is incompatible, **BLOCK**. Do not silently downgrade. An exception requires a reviewed ADR with an owner, exact incompatibility evidence, expiry/recheck date, and explicit approval.
6. Pin exact versions in manifests/toolchain files; commit package manager lockfiles and Go checksums; pin scaffolding CLIs and CI actions; record exact scaffold commands and generated output.
7. Run all contract validators, formatting/linting, type checks, unit/integration/e2e/security tests, and production builds. Record the result in `contracts/architecture/technology-version-lock.yaml`.
8. Run a new resolution for every bootstrap and release candidate, and whenever the dependency graph or build plan changes. Do not reuse an earlier run as current evidence, even when the version number has not changed. Upgrade to newer stable versions only with the complete validation suite; do not auto-upgrade production dependencies.

## What counts as stable

A release explicitly designated stable/GA by its official project is eligible. A version number alone is insufficient if the vendor labels the feature or SDK experimental. Stable package version and feature maturity must both be checked. Experimental APIs are not allowed in critical production paths without an approved ADR and explicit risk acceptance.

## Required inventory

At minimum, resolve: Astro, `@astrojs/node`, `@astrojs/svelte`, Svelte, TypeScript, Node.js, pnpm, any retained monorepo/build tools, Go, Appwrite CLI and used SDKs, Wrangler, Cloudflare Agents SDK and used integrations, test runners, browser automation, linters, formatters, security scanners, schema validators, code generators, CI actions, and container base images.

The Appwrite CLI, Astro CLI, Wrangler, and Go tooling must generate their respective platform-owned project structures. Record the exact tool version and exact command used; do not hand-invent platform layouts.

## Mandatory per-run freshness

Each resolution run must have a unique run ID and fresh UTC timestamp, official release/registry evidence (including publication/release timestamp where available), the exact selected version, the latest stable version observed at that same check, a comparison result, compatibility-test evidence, and exact pin/lockfile locations. Evidence from a previous run is retained for audit only. A version that is no longer latest stable is blocked unless a reviewed, time-bounded exception ADR is approved. The package manager and every scaffolding/deployment CLI must be exact versions; major-only pins such as `pnpm@10` are invalid. Mutable `latest` tags may be used only during resolution, never as committed build pins.

The repository must expose a dedicated `validate:technology-resolution` gate. This gate fails closed when the lock is unresolved, the package manager version is not exact, a lockfile is absent, any technology lacks current-run evidence, or compatibility tests have not passed. Structural contract validation is not proof that the technology lock is complete.

## Current archive status

The dependency versions currently present in the archive are historical pins. They are **not certified as latest stable** by this document. `technology-version-lock.yaml` is intentionally empty until a fresh resolution is performed at implementation bootstrap. This is an explicit implementation gate, not permission to use arbitrary versions.

## Fail-closed conditions

Block if a version has no official source evidence, if exact pins/lockfiles are missing, if an unsupported or prerelease version is selected, if a selected version is behind latest stable without an approved exception, or if compatibility tests have not passed. Never change architecture, provider, language, or platform boundaries merely to accommodate a version bump without an approved contract/ADR change.
