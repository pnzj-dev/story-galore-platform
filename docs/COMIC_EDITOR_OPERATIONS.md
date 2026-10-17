# Comic Editor Operations

## Operation taxonomy
`PAGE_CREATE`, `PAGE_UPDATE`, `PAGE_MOVE`, `PAGE_DELETE`, `PAGE_DUPLICATE`, `PANEL_CREATE`, `PANEL_UPDATE`, `PANEL_MOVE`, `PANEL_DELETE`, `LAYER_CREATE`, `LAYER_UPDATE`, `LAYER_MOVE`, `LAYER_DELETE`, `TEXT_UPDATE`, `DIALOGUE_UPDATE`, `ASSET_ATTACH`, `ASSET_DETACH`, `TRANSFORM_APPLY`, `AI_APPLY`, `UNDO`, `REDO`.

## Operation requirements
Every operation is schema-validated, authorization-checked, tenant-scoped, idempotent and revision-aware. Operations never directly mutate a published snapshot.

## Merge rules
- Independent property edits on different entities: mergeable.
- Edits to different properties of the same entity: mergeable only when fields are declared independent.
- Same-field edits: conflict.
- Delete vs update: conflict.
- Reorder vs reorder of the same collection: conflict unless the server can deterministically merge by stable IDs.
- AI_APPLY: never auto-merge; requires current revision.

## Grouping
A single user gesture may contain multiple low-level operations. The server stores individual operations but exposes a grouped history entry for undo/redo.
