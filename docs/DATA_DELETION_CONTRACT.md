# Data Deletion Contract

## Required sequence
1. Authenticate and validate deletion authority.
2. Create immutable deletion request/operation record.
3. Apply domain-level tombstone/deletion state.
4. Delete or revoke storage objects and derivatives.
5. Propagate to search, vectors, caches/CDN, projections and recommendations.
6. Revoke signed URLs and dependent access.
7. Process eligible analytics deletion/anonymization.
8. Record completion/failure per subsystem.
9. Verify convergence and expose operation status.

## Guarantees
- No subsystem may recreate deleted content from stale projections after convergence.
- Replayed deletion events are safe and idempotent.
- Financial/audit records that must legally remain are minimized, access-restricted and decoupled from deleted user content.
- Backups follow their declared lifecycle; deletion is not falsely reported as immediate erasure from immutable historical backup media.
