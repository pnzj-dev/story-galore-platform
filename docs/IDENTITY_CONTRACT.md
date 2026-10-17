# Identity and Tenant Contract

## Principal types
**User** is the authentication principal. **Creator** is a User with creator capabilities. **Workspace** is a tenant/collaboration boundary. **Staff** is a User with explicit staff capabilities. **Agent** is a delegated execution principal with a scoped lease.

## Rules
- Appwrite authentication establishes identity; it does not establish business authorization.
- Creator/workspace membership and plan/entitlement are separate dimensions.
- Staff role, capability, scope and approval requirements are evaluated server-side.
- Agents never inherit a human's unrestricted authority. Delegation is explicit, scoped, short-lived and auditable.
- Break-glass access is temporary, purpose-bound and automatically expires.


## Adult Content Display Contract
- Canonical rule: `docs/ADULT_CONTENT_DISPLAY_CONTRACT.md`.
- Adult display is opt-in and defaults to `DISABLED`. Paid entitlement and age eligibility are necessary but insufficient.
- Unknown/stale/unavailable preference fails closed.
- All search, discovery, recommendation, API, MCP, notification, deep-link, cache, projection, vector, download and offline surfaces MUST enforce the same server-side decision.
