# Creator Studio Deterministic Implementation Contract

## Scope
This document removes implementation discretion from the Creator Studio and comic editor. Existing contracts remain authoritative; this document defines how they compose.

## Bounded-context ownership
- Studio owns authoring state, editor operations, revisions and creator workflow state.
- Media owns canonical media lifecycle and storage.
- AI owns generation jobs, provenance and credit/BYOK accounting.
- Publication owns publication lifecycle and published records.
- Entitlement owns access.
- Policy Engine owns authorization decisions.
- Analytics owns rebuildable projections.

Studio MUST reference `mediaAssetId`, never treat Appwrite storage file IDs as its domain identity.

## Persistence
Use `contracts/studio/persistence-mapping.yaml`. Domain IDs are stable UUIDs. Tenant/workspace scope is mandatory. Editor operations are append-only. Revisions and publication snapshots are immutable.

No Studio UI component may access Appwrite directly.

## Command/query separation
Mutations use `contracts/studio/commands.yaml`; reads use `contracts/studio/queries.yaml`. Commands require actor, tenant, authorization, Policy Engine decision and idempotency. Editor mutations additionally require an expected revision.

## Editor document model
A comic document is the canonical authoring aggregate. Pages and panels are ordered children. Layers and text/dialogue are revisioned document state. Current state is derived from the latest accepted revision plus subsequent accepted operations.

## Operation model
Every editor operation has `operationId`, `mutationId`, `documentId`, `baseRevision`, `actorId`, `clientId`, `type`, `payload`, `createdAt`. Duplicate mutation IDs return the original result. Operations against a stale revision are rebased only when the contract marks them mergeable; otherwise the server returns `REVISION_CONFLICT`.

## Concurrency
No silent last-write-wins. Server revision is authoritative. Compatible operations may be rebased. Deletes conflict with edits to the deleted entity. Ordering operations conflict when their target ordering changed incompatibly. Conflict resolution produces a new revision; historical revisions are never mutated.

## Geometry
Use normalized 0..1 document coordinates as defined by `contracts/studio/editor-geometry.schema.yaml`. Rendering resolution is derived from document dimensions and output format. Geometry must remain deterministic across editor, reader and export pipelines.

## Undo/redo
Undo and redo operate on accepted editor operations and always create new revisions. An AI apply action is one undo transaction. Historical revisions are immutable.

## Media integration
Studio stores `mediaAssetId`. Media readiness, authorization and delivery URLs are resolved by the Media domain. A missing, quarantined, deleted or unauthorized media asset blocks publication when required by validation.

## AI integration
AI output is immutable generation output until explicitly applied. Applying output creates a new editor operation and revision, preserves the previous state, records provenance and passes policy/credit/BYOK checks.

## Publication snapshot
Publishing is snapshot-based. The approved source revision is copied into an immutable publication snapshot. Later Studio edits never mutate a published snapshot.

## Validation
Use `contracts/studio/validation.schema.yaml`. Blocking failures prevent publication. Warnings do not. Validation covers schema integrity, references, geometry, media readiness, moderation, content/age policy, provenance and publication permissions.

## Import/export
Use `contracts/studio/import-export.yaml`. Imports are validated before writes and never import secrets. Published exports use immutable publication snapshots.

## Completion gate
An implementation is not complete until persistence mappings, command handlers, query authorization, operation idempotency, concurrency tests, undo/redo, import/export validation, publication snapshot isolation and all Studio scenarios pass.
