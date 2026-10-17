# Creator Studio Contract

## Purpose
Creator Studio is the authenticated creator workspace for building projects, story bibles, characters, worlds, assets, drafts, comic documents, AI generations and publications.

## Canonical routes
- `/studio`
- `/studio/dashboard`
- `/studio/projects`
- `/studio/projects/:projectId`
- `/studio/projects/:projectId/story-bible`
- `/studio/projects/:projectId/characters`
- `/studio/projects/:projectId/world`
- `/studio/projects/:projectId/assets`
- `/studio/projects/:projectId/prompts`
- `/studio/projects/:projectId/ai`
- `/studio/projects/:projectId/drafts`
- `/studio/projects/:projectId/editor`
- `/studio/projects/:projectId/publications`
- `/studio/projects/:projectId/analytics`

## Architecture
UI components MUST NOT call Appwrite directly. Commands flow through application/domain services, authorization and Policy Engine checks, then persistence adapters. Durable work uses Cloudflare Workflows through the existing WorkflowRunner abstraction.

## Project model
A project is creator/workspace scoped. It contains canonical creative context and may contain multiple drafts and publications. Project status is DRAFT, ACTIVE or ARCHIVED.

## Creative context
Story Bible, Characters, World, Prompt Templates and Studio Assets are first-class records. References MUST use stable IDs. AI generation MUST preserve provenance and MUST NOT destructively overwrite a draft.

## Permissions
Every Studio mutation requires authenticated actor, tenant/workspace scope, resource permission, Policy Engine decision and idempotency where externally visible. UI hiding is not authorization.

## Required operations
`studio_project_create`, `studio_project_update`, `studio_project_archive`, `story_bible_get`, `story_bible_update`, `character_create`, `character_update`, `character_delete`, `world_update`, `asset_attach`, `draft_open`, `draft_save`, `draft_revision_list`, `draft_revision_restore`, `editor_apply_operation`, `editor_reorder`, `generation_create`, `generation_cancel`, `generation_retry`, `generation_apply_to_draft`, `publication_validate`, `publication_submit`, `publication_schedule`, `publication_publish`.

## Save contract
The client sends `draftId`, `baseRevisionId`, `mutationId`, `clientId`, operation payload and client timestamp. The server accepts only against the expected revision or returns a conflict. The UI MUST display `Saving`, `Saved`, `Offline`, `Syncing`, `Conflict` or `Save failed`; it MUST NOT claim Saved before server acknowledgement.

## Offline contract
Editor mutations may queue in IndexedDB. Queued mutations retain mutation IDs and base revision IDs. Reconnect replays idempotently. Conflicts are explicit and require resolution; silent last-write-wins is forbidden.

## AI contract
Generation requests pass through authentication, entitlement, adult/content policy, provider/model policy, credits/BYOK policy and cost guardrails. Outputs become immutable generation records and may be explicitly applied to a draft through an editor operation.

## Publication contract
Publication validation checks required metadata, content state, media readiness, moderation, age/content policy, entitlement configuration and publication permissions. Publishing creates an immutable published version. Scheduled publication references an approved revision.

## Coding-agent completion gate
Studio is incomplete until all contracts under `contracts/studio/` validate, `contracts/state-machines/studio.yaml` validates, command handlers have authorization/idempotency tests, draft recovery tests pass, and the Studio E2E scenarios are green.
