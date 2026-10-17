# Historical release notes

This directory contains version-specific release notes and historical implementation handoffs that are retained for traceability but are not the canonical source of current behavior.

## Rules

- Current machine-readable contracts under `contracts/` take precedence.
- Current repository-wide rules are in `AGENTS.md`; the documentation map is `../../README.md`.
- Do not implement a historical behavior merely because it appears in one of these records. Verify the current contract and any superseding ADR first.
- New release notes stay in the active docs area only while they define current architecture decisions; once superseded, move them here and update references.

## Archived documents

The filenames retain their release identifiers. Search this directory by version or topic; release manifests are archived separately in `../change-manifests/`.
- V19.5.20 — Deterministic Appwrite Central Agent Gateway contract.
- [V19.5.20 — Central Agent Gateway](V19.5.20_CENTRAL_AGENT_GATEWAY.md) — one Appwrite Function, in-process policy engine, explicit implementation blockers.

- `V19.5.8_BACKEND_RUNTIME_SIMPLIFICATION.md` — historical backend runtime decisions; superseded by current runtime and deployment contracts.
- `ARCHITECTURE_SIMPLIFICATION_LOOP_V19_5_7.md` — historical architecture analysis; superseded by the current Central Agent Gateway and Appwrite MCP contracts.
- `V19.5.17_APPWRITE_MCP_AGENT_ACCESS.md` — historical agent-access note; current gateway contract and V19.5.21 application boundary take precedence.
