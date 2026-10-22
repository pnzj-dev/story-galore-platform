# ADR 0021 — Central Agent Gateway in Python (Go exception)

## Status

Accepted.

## Context

The Central Agent Gateway is the sole authorization path for autonomous-agent
access to Appwrite, via the registered Appwrite MCP connection. `AGENTS.md`
rule 4 requires Go for Appwrite Functions (the only exception being the
NOWPayments TypeScript function, justified by a provider SDK with no Go
equivalent).

The self-hosted Appwrite MCP server (`mcp-server-appwrite`) is a Python stdio
process. The gateway is its MCP client: it must host the MCP client and connect
to the Python server over stdio. A Go function cannot do this — the Appwrite Go
runtime does not ship Python/uv to spawn the server, and there is no Go MCP
client for the Python-only server.

## Decision

The `central-agent-gateway` function runs in the Appwrite Python runtime. This
mirrors the NOWPayments precedent: the gateway must use a Python-only component
(the `mcp-server-appwrite` MCP server + the `mcp` Python client SDK), so Python
is the technically-supported runtime.

The gateway's own domain logic remains minimal: the Policy Engine (deny-by-default
allowlist + capability + tool-id → native-tool mapping) and the audit event. It
does not own domain state; mutation tools delegate to the canonical `api`
function (or stay fail-closed until their domain adapter is registered).

## Consequences

- The gateway function's runtime/language contract changes from Go to Python
  (pinned Python + `mcp`/`mcp-server-appwrite`/`appwrite` versions).
- The in-process Policy Engine is ported to Python with the same allowlist and
  mapping data (single source of truth remains the contracts).
- No other Appwrite Function changes runtime; this exception is scoped to
  `central-agent-gateway`.
