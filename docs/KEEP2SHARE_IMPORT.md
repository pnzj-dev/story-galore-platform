# Keep2Share Import Agent

The Keep2Share Import Agent is a V1 Cloudflare Agent for importing content from Keep2Share only when the actor has explicitly authorized the import and has legitimate access to the source content.

## Provider integration

Keep2Share publishes a v2 API at `https://keep2share.cc/api/v2/`. The provider documentation describes authorization, file lookup, download URL generation, file status and metadata operations. The implementation must prefer the provider API for operations it supports and use the browser only for page/link discovery or API gaps.

The coding agent must not copy credentials into prompts, logs, workflow histories, analytics or tickets. Provider authentication belongs in the secret/session capability boundary.

## Security

All downloaded files and archive metadata are untrusted. Archives are inspected before extraction. Extraction uses a new private empty working directory. Absolute paths, traversal, unsafe links, device entries, special files and archive bombs are rejected according to `contracts/archive/normalization.yaml`.

OWASP documents archive directory traversal and symlink attacks as upload/extraction risks. GNU tar likewise recommends extracting untrusted archives into an otherwise-empty protected directory. These controls are mandatory here.

## Metadata

The importer preserves the original bytes, original filename, original SHA-256 and original metadata snapshot. It creates a normalized metadata projection rather than destructively rewriting the source.

For media metadata, FFmpeg exposes global, stream, chapter and program metadata and expects UTF-8 strings. ExifTool supports reading/writing metadata and provides explicit deletion/copy semantics. The importer must preserve technical metadata required for correct rendering (for example safe color-profile information) while removing sensitive or operational metadata from the public projection.

## Archive normalization

Archives are normalized as derived artifacts. Each member receives an immutable original path plus a deterministic normalized path. Collisions are resolved using the specified deterministic short-hash suffix. The normalized archive is produced only after the complete archive has passed validation and security scanning.

The original archive remains available as restricted provenance and is never silently replaced by the normalized archive.
