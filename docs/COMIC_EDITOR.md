# Comic Editor Contract

## Canonical document model
`ComicDocument -> ComicPage -> ComicPanel -> ComicLayer -> Text/Dialogue/Asset reference`.

The document owns page order. A page owns panel order. A panel owns layer order. Reading order is explicit and cannot be inferred from database insertion order.

## Supported document formats
COMIC, MANGA, WEBTOON, STRIP, GRAPHIC_NOVEL and MIXED.

## Supported reading formats
PAGINATED, VERTICAL, HORIZONTAL, WEBTOON, STRIP and MIXED.

## Editor operations
All edits are represented as versioned operations. Supported operations are CREATE, UPDATE, DELETE, REORDER, DUPLICATE, APPLY_GENERATION and RESTORE_REVISION. Operations are idempotent by `mutationId`.

## Layout
Panels use normalized or document-space bounds. The editor MUST preserve deterministic page dimensions, panel order and layer order. Locked layers cannot be mutated by ordinary editor operations.

## Text and dialogue
Text elements and dialogue are separate domain records. Dialogue references a character and a bubble type. SFX and narration use the same dialogue contract but distinct bubble types.

## Assets
The editor references canonical MediaAsset IDs. It MUST NOT embed provider-specific storage URLs as the source of truth. Delivery URLs are resolved at read time through the media authorization contract.

## AI application
AI output is never written directly over existing creator content. Applying a generation creates an explicit editor operation referencing the generation ID and resulting assets/text. Undo/restore operates through revisions.

## Validation
Before publication the editor validates: page dimensions, empty/invalid references, missing media, reading order, unsupported assets, text overflow where deterministic validation is available, content rating, moderation state and media readiness.
