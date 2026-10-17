# Master Definition of Done

A V1 capability is DONE only when all applicable items are evidenced:

- contract documented and registered;
- state machine transition rules implemented;
- authorization/policy checks server-side;
- Appwrite permissions and indexes verified;
- idempotency and outbox/inbox semantics implemented for mutations/events;
- errors are stable and safe;
- audit/correlation implemented for sensitive actions;
- privacy classification/retention/deletion declared;
- unit + integration + E2E tests pass;
- relevant UI scenario passes across loading/empty/error/restricted/offline states;
- security/SSRF/secret-leak checks pass where applicable;
- migration and rollback path verified;
- degraded-mode behavior verified;
- analytics coverage exists without prohibited data;
- operational runbook exists for critical workflows;
- staging evidence exists;
- production approval is recorded.

Documentation alone cannot satisfy an executable criterion.
