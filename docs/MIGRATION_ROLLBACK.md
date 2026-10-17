# Migration and Rollback Contract

Production schema changes follow:

`expand -> migrate/backfill -> validate -> switch consumers -> contract`

Every migration has:

- immutable migration ID
- version/checksum
- owner
- compatibility window
- forward procedure
- rollback or compensating procedure
- validation checks
- observability/backfill status

Destructive changes require an explicit compatibility window and approval. Rollback restores service compatibility; it does not assume that arbitrary data mutation can always be reversed.
