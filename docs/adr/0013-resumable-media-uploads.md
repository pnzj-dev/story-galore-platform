# ADR 0013: Resumable Media Uploads

## Decision
Use direct, chunked/resumable uploads to Appwrite Storage with a StoryGalore-owned UploadSession and IndexedDB client recovery.

## Rationale
Large media must not traverse the application server. The upload must survive transient network failure, browser restart and client reconnect without trusting client progress.

## Non-goals
Cloudflare is not the upload origin. R2, Cloudflare Stream and Cloudflare Images are not introduced as canonical storage by this ADR. Exact SDK method names and provider limits remain version-specific and must be derived from the installed Appwrite tooling/docs.

## Invariants
- Appwrite owns canonical bytes.
- UploadSession owns upload orchestration state.
- MediaAsset owns media lifecycle state.
- Processing is separate from upload completion.
- Client progress is never authoritative.
- Chunk retries are idempotent.
