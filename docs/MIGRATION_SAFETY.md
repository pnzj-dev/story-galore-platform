# Migration Safety

Agents classify schema changes before implementation:

- **SAFE**: additive fields, new tables/collections, new indexes, backward-compatible projections.
- **REQUIRES PLAN**: rename, type changes, permission changes, index removal, event shape changes.
- **DESTRUCTIVE**: data deletion, irreversible transformation, access reduction, dropping storage.

Destructive production changes require an approved migration plan, backup/restore verification, staged rollout, rollback strategy, and explicit approval. Agents must never silently use `--force` or equivalent destructive flags against production.
