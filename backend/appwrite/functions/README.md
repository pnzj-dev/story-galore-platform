# Appwrite Functions

StoryGalore requires Go for Appwrite Functions wherever Appwrite technically supports Go. Use the official Appwrite CLI scaffold and do not hand-invent the generated function layout.

## Go function layout (verified)

The open-runtimes Go runtime wraps the function via a server `main.go` that does `import "openruntimes/handler"` and calls `handler.Main(context)`. Therefore each function's code MUST use:

- **`package handler`** (not `package main`)
- **`module openruntimes/handler`** in `go.mod`
- entrypoint `func Main(ctx openruntimes.Context) openruntimes.Response`

`go.mod`:

```go
module openruntimes/handler

go 1.23.0

require github.com/open-runtimes/types-for-go/v4 v4.0.7
```

The function's own `main.go` holds `package handler` + `func Main(...)`; there is no `func main()` (the runtime injects it). `package main` / a custom module path fails the build with `import "openruntimes/handler" is a program, not an importable package`.

Verified working runtime on the self-hosted instance: `go-1.23` (matches the handler's `go 1.23.0`).

## `api` gateway: schedule + scopes

The `api` function is the gateway and also carries a cron `schedule`
(`*/5 * * * *`) that runs the alert evaluation on the schedule trigger
(`x-appwrite-trigger: schedule`).

**Scope reset gotcha:** the ephemeral key (`APPWRITE_FUNCTION_API_KEY` /
`x-appwrite-key`) is scoped by the function's `scopes` field. Any
`appwrite functions update` that omits `--scopes` resets them to `[]`,
silently revoking the gateway's data access (`FORBIDDEN` on admin ops).
Always pass the full `--scopes` list when updating the `api` function, e.g.:

```bash
appwrite functions update --function-id api --name api \
  --schedule '*/5 * * * *' \
  --scopes 'databases.read' --scopes 'databases.write' \
  --scopes 'tables.read' --scopes 'tables.write' \
  --scopes 'columns.read' --scopes 'columns.write' \
  --scopes 'rows.read' --scopes 'rows.write' \
  --scopes 'indexes.read' --scopes 'indexes.write' \
  --scopes 'users.read' --scopes 'users.write' \
  --scopes 'sessions.read' --scopes 'sessions.write' \
  --scopes 'teams.read' --scopes 'teams.write' \
  --scopes 'functions.read' --scopes 'functions.write' \
  --scopes 'executions.read' --scopes 'executions.write' \
  --scopes 'buckets.read' --scopes 'buckets.write' \
  --scopes 'files.read' --scopes 'files.write' \
  --scopes 'providers.read' --scopes 'providers.write' \
  --scopes 'topics.read' --scopes 'topics.write' \
  --scopes 'messages.read' --scopes 'messages.write' \
  --scopes 'subscribers.read' --scopes 'subscribers.write' \
  --scopes 'targets.read' --scopes 'targets.write' \
  --scopes 'tokens.read' --scopes 'tokens.write'
```

## Function consolidation (V1 runtime-simplicity)

The `api` function is the single gateway implementation: it carries every
domain command/query inline (entitlement, payments + webhooks, moderation,
notifications, ads, media, recommendations, audit, cleanup, etc.) rather than
delegating to per-domain functions. The catalog therefore marks the other
domain functions `CONSOLIDATED_INTO_API_GATEWAY` — their declared
responsibilities are implemented inside the `api` gateway, and the scaffold
functions must not be treated as a separate runtime path. Those scaffold
functions are **fail-closed stubs**: they return `POLICY_ENGINE_NOT_IMPLEMENTED`
and perform no domain work.

Exceptions (implemented as their own deployables):

- `analytics` — scheduled daily aggregation + dashboard query contract.
- `nowpayments` — TypeScript/Node; the NOWPayments SDK has no Go equivalent.

