# Cross-Agent Contract Compatibility

Shared contracts are consumed by domain, API, MCP, Cloudflare Workflows, UI, analytics, mobile, desktop, and operational agents.

Any contract change MUST declare:

- contract name/version
- breakingChange boolean
- affectedConsumers
- migrationRequired
- compatibilityWindow
- owner
- validation evidence

Agents MUST NOT silently change shared schemas, event envelopes, state-machine transitions, API semantics, or MCP tool contracts.

Breaking changes require an explicit migration path and compatibility gate before release.
