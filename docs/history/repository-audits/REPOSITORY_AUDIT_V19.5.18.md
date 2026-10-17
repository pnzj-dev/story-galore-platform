# Repository audit and cleanup — V19.5.18

## Scope

Audited the V19.5.17 kit for stale manifests, contradictory documentation, historical release-note clutter, broken local Markdown links, duplicate file contents, obsolete paths, and agent/MCP architecture consistency.

## Before (high-level)

```text
storygalore/
├── agents/
├── apps/web/
├── backend/appwrite/
├── backend/cloudflare/
├── contracts/
├── docs/
│   ├── many active domain documents mixed with V14/V17/V18/V19 release notes
│   ├── REPOSITORY_CLEANUP_V19.5.16.md
│   └── README.md (stale Admin RBAC blocker wording)
├── scripts/
├── tests/
├── V19.5.16_CHANGE_MANIFEST.yaml (obsolete but required by validator)
├── V19.5.17_CHANGE_MANIFEST.yaml
└── VERSION (19.5.17)
```

## After (high-level)

```text
storygalore/
├── .github/
├── agents/                         # 17 registered logical agents
├── apps/web/                       # one Astro application
├── backend/
│   ├── appwrite/                   # canonical Appwrite resource boundary
│   └── cloudflare/                 # registered Cloudflare boundary
├── contracts/                      # canonical machine-readable contracts
├── docs/
│   ├── adr/                        # architectural decision records
│   ├── architecture/               # current cross-cutting architecture guidance
│   ├── history/
│   │   ├── releases/               # older versioned release notes
│   │   ├── repository-audits/      # previous repository audits
│   │   └── change-manifests/       # previous release manifests
│   ├── support/
│   ├── ui/
│   └── README.md                   # documentation map and source-of-truth rules
├── packages/
├── scripts/
├── tests/
├── V19.5.18_CHANGE_MANIFEST.yaml   # only current release manifest at root
└── VERSION                        # 19.5.18
```

## Changes

- Moved older release-note snapshots into `docs/history/releases/` while preserving their content and repairing relative Markdown links.
- Moved the V19.5.16 repository audit into `docs/history/repository-audits/`.
- Archived the V19.5.16 and V19.5.17 release manifests. Only the current manifest remains at the repository root.
- Updated the repository-coherence validator to require the current manifest, rather than a stale release manifest.
- Corrected stale documentation claiming that Admin RBAC was still only examples; the 53-entry planned registry exists, while route parity and runtime tests remain pending.
- Removed raw web-search citation markers from `docs/MCP.md` and replaced them with plain official documentation links.
- Updated `VERSION`, the docs index, history index, and README for V19.5.18.

## Findings intentionally retained as blockers

- `contracts/architecture/technology-version-lock.yaml` is intentionally unresolved pending dated official-source verification.
- `pnpm-lock.yaml` is absent; reproducible installation remains blocked until the exact toolchain is verified and a lockfile is generated.
- `package.json` currently declares `pnpm@10` without a patch/minor pin; this remains a version-lock blocker and was not silently guessed.
- Platform-generated Astro/Appwrite/Cloudflare scaffolds are not present yet.
- Appwrite MCP unattended authentication and native tool catalog mappings remain unverified and block runtime implementation.
- Runtime authorization and actual Astro route-file parity are not established by contract validators.

## Validation evidence

The following checks are run for this archive: repository coherence, documentation consistency, Appwrite MCP agent-access contract, authorization and Admin RBAC contract validators, technology freshness contract structure, contract YAML syntax, and local Markdown-link resolution. Results are reported separately; none is represented as proof of runtime security or production readiness.
