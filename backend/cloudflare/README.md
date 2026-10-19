# Cloudflare platform boundary

This is the canonical ownership boundary for StoryGalore Cloudflare Workers, Agents SDK, Workflows, and MCP components.

**Do not hand-author platform-generated internals.** At implementation bootstrap, resolve and pin Wrangler and the applicable SDK versions, run the registered official scaffolder, inspect and commit its output, then register the actual generated tree in the implementation/source-ownership contracts.

Expected ownership areas (not a prescribed generated directory layout):
- MCP Worker boundary
- Cloudflare Agents SDK runtime
- Cloudflare Workflows durable execution

## Workflow deployment environments

Each workflow deploys per environment by suffixing the Worker name with the
environment (`-dev`, `-staging`, `-prod`). The `wrangler.jsonc` `name` stays the
base name (`storygalore-generation`); `wrangler deploy --name <base>-<env>` (or
the equivalent API `script_name`) selects the environment. The Appwrite secrets
(`APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`) point at the
matching Appwrite instance — the current `-dev` deployments target the dev
Appwrite project.

No example implementation is retained in the production repository. Integration behavior is specified by canonical contracts; deployed Cloudflare components must be generated using pinned official tooling and registered before implementation.


## MCP boundary

