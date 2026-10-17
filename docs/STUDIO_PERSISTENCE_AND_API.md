# Studio Persistence and API Contract

Canonical persistence mappings are in `contracts/studio/persistence-mapping.yaml`. Canonical commands and queries are in `contracts/studio/commands.yaml` and `contracts/studio/queries.yaml`.

## API rules
- Domain/application services own mutations.
- Appwrite adapters own persistence mechanics.
- API responses expose domain IDs and safe projections, not raw Appwrite documents.
- Cursor pagination is mandatory for unbounded lists.
- Idempotency keys are required for externally visible mutations.
- ETags/revision tokens may optimize reads but cannot replace authorization or revision checks.

## Response semantics
Successful mutations return the accepted domain revision and emitted operation/event identifiers. Conflicts return current revision metadata and a structured conflict payload; clients must not overwrite server state silently.
