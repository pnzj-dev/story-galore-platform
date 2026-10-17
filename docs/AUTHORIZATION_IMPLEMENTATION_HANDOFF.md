# Authorization Implementation Handoff — V19.5.13

## Status

The authorization design blockers are resolved at the specification level. Runtime implementation remains pending and MUST NOT be described as complete until the acceptance matrix passes against the generated Astro route inventory and each authoritative backend boundary.

## Canonical contracts

- Planned V1 route inventory: `contracts/astro/route-inventory.yaml`
- Route policy templates: `contracts/astro/routes.yaml`
- Route protection semantics: `contracts/astro/route-protection.yaml`
- Account/creator capabilities: `contracts/permissions/route-access.yaml`
- Admin exact-route registry: `contracts/permissions/admin-rbac.json`
- Session and cookie runtime: `contracts/security/authentication-session-runtime.yaml`
- Cross-boundary test matrix: `contracts/security/authorization-acceptance-matrix.yaml`
- Completeness gate: `contracts/security/authorization-completeness.yaml`

## Implementation sequence

1. Scaffold Astro using the pinned official Astro CLI workflow; do not hand-create framework internals.
2. Enumerate actual Astro pages and normalize `[param]` segments to `:param`. Compare the actual inventory with the planned inventory. Any unexplained addition, omission, duplicate, catch-all, or policy conflict blocks route implementation.
3. Implement Appwrite session validation on the server; keep session cookies HttpOnly and Secure in production. Never trust client role claims or store session tokens in local storage.
4. Implement route middleware as an early gate only. Keep backend/domain authorization authoritative.
5. Apply CSRF controls to cookie-authenticated mutations and validate same-origin return-to destinations.
6. Enforce capability, tenant scope, resource ownership, approval, idempotency and audit requirements at every authoritative operation.
7. Run every case in `contracts/security/authorization-acceptance-matrix.yaml` against middleware, Actions/API routes, Appwrite Functions, domain commands, Agent tools and MCP tools as applicable.
8. Do not mark production-ready until all required tests pass and evidence is recorded.

## Required negative guarantees

- A reader cannot gain creator/admin rights by editing client state or request claims.
- A creator cannot access another creator's resources by changing identifiers.
- Hiding a UI control never substitutes for backend authorization.
- Missing/unknown policy and policy-service outage never allow an operation.
- A route registration or YAML syntax check alone is not security evidence.

## Error semantics

- HTML page without a valid session: redirect to login with a safe local return-to path.
- API/mutation without a valid session: `401`.
- Authenticated but unauthorized: `403`, or `404` where a resource's existence must be concealed.
- Step-up/approval required: registered machine-readable error code and no side effect.
- Authorization service unavailable: fail closed; `503` for API/mutation.
