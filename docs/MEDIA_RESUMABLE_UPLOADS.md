# Resumable Media Uploads

## Canonical architecture

Appwrite Storage is the canonical byte origin. StoryGalore owns the UploadSession and authorization state. The browser uploads directly to the selected Appwrite upload path using the current supported Appwrite chunked/resumable mechanism. StoryGalore does not proxy large media bytes through Astro or Cloudflare.

## Protocol

1. `media_upload_create` authorizes the actor, validates metadata, creates MediaAsset and UploadSession, selects the configured chunk size/concurrency profile, and returns an opaque uploadId plus the current Appwrite upload handle/reference.
2. Client persists uploadId, file fingerprint and confirmed progress in IndexedDB.
3. Chunks are uploaded directly to Appwrite. Chunk retries use deterministic idempotency keys derived from uploadId + chunkIndex + content fingerprint.
4. Client progress is advisory. On retry/reconnect/restart the server/Appwrite-confirmed state is authoritative.
5. `media_upload_complete` verifies ownership, session state, byte count and configured checksum policy, then marks the upload complete. It does not mark the MediaAsset READY.
6. Media processing begins only after completion and remains a separate Cloudflare Workflows/media state transition.

## Deterministic defaults

- Initial client concurrency: 4 chunks.
- Client may reduce concurrency under repeated network/throttling failures.
- Maximum concurrency is configuration-controlled; clients cannot exceed the server-advertised ceiling.
- Retry uses exponential backoff with jitter and a bounded attempt count from runtime configuration.
- Chunk size is server-advertised and immutable for an upload session.
- Upload session expiry is server-controlled and renewed only by an authorized resume operation.
- No client-supplied byte offset is trusted without server confirmation.

## Recovery

Network loss -> reconnect -> fetch authoritative session -> reconcile confirmed chunks -> resume missing chunks. Browser restart uses the same flow from IndexedDB. If the session is expired/cancelled, the client must not resume it and must offer a new upload.

## Security

Never trust filename, MIME declaration, size declaration, client checksum, chunk order or client progress. Enforce authorization, quotas, file-size limits and policy before session creation and again on resume/complete. Never expose Appwrite service credentials.

## Cleanup

Expired/cancelled/incomplete sessions are cleaned idempotently. Cleanup removes incomplete Appwrite objects when the configured Appwrite lifecycle permits, marks the UploadSession terminal, and emits the corresponding event.
