# Cloudflare platform boundary

This is the canonical ownership boundary for StoryGalore Cloudflare Workers, Agents SDK, Workflows, and MCP components.

**Do not hand-author platform-generated internals.** At implementation bootstrap, resolve and pin Wrangler and the applicable SDK versions, run the registered official scaffolder, inspect and commit its output, then register the actual generated tree in the implementation/source-ownership contracts.

Expected ownership areas (not a prescribed generated directory layout):
- MCP Worker boundary
- Cloudflare Agents SDK runtime
- Cloudflare Workflows durable execution

No example implementation is retained in the production repository. Integration behavior is specified by canonical contracts; deployed Cloudflare components must be generated using pinned official tooling and registered before implementation.


## MCP boundary

