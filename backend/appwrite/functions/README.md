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
