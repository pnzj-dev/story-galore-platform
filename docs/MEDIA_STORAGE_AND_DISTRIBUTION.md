# Media Storage & Distribution Contract

## Non-negotiable architecture

- Appwrite Storage is the canonical and authoritative media origin for images, video, audio, documents and other media.
- StoryGalore domain records in Appwrite TablesDB remain the source of media metadata/state.
- Cloudflare is the distribution/edge layer only: CDN/cache, edge delivery, authorization enforcement where configured, WAF/rate limiting and delivery optimization.
- Do not introduce Cloudflare R2, Cloudflare Images, Cloudflare Stream or another storage origin as a replacement for Appwrite unless a new architecture decision explicitly changes this contract.
- Cloudflare Workers may issue/enforce delivery authorization and route distribution requests; they do not become the canonical media store.

## Upload path

```text
Client -> StoryGalore upload authorization -> Appwrite Storage -> media record -> Cloudflare Workflows processing -> READY
```

Large uploads use resumable/chunked mechanisms supported by the selected Appwrite upload path. Server-side validation inspects the actual file/container after upload. File extensions and client MIME declarations are untrusted input.

## Distribution path

Public:

```text
Client -> Cloudflare -> Appwrite origin
```

Protected:

```text
Client -> StoryGalore authorization -> short-lived delivery authorization -> Cloudflare -> Appwrite origin
```

The client never receives Appwrite service credentials or unrestricted protected-origin URLs.

## Authorization order

For protected content evaluate, as applicable:

1. authentication/session
2. tenant/creator permissions
3. age eligibility
4. explicit adult-content opt-in
5. entitlement
6. publication visibility/status
7. moderation state
8. jurisdiction
9. Policy Engine decision
10. rate/admission controls

Unknown sensitive policy state fails closed.

## Cache safety

Authorization and caching are separate concerns. A CDN cache hit must never be interpreted as proof of entitlement. Public and protected cache objects must use explicit cache policies. User-specific authorization state must not be embedded in a shared cache key. Denied responses must never poison successful media cache entries.

## Variants

Supported derivative classes include original, thumbnail, small, medium, large, reader, preview, poster, playback and OG. Originals are immutable. Derivatives are separate media assets and carry the processing profile/version that created them.

## Video

Video is processed asynchronously when processing is durable or expensive. Processing may produce poster frames and multiple playback variants. The playback implementation must support HTTP range/streaming requirements and, when selected, segmented streaming such as HLS. The contract does not mandate a Cloudflare-specific video product.

## Deletion and restriction

Canonical deletion/restriction occurs first in StoryGalore/Appwrite. A durable deletion event then invalidates Cloudflare PRIMARY distribution, removes derivatives and propagates to search, vectors, projections and recommendations. Cleanup is idempotent, retryable and observable.

## Security

The implementation must address MIME spoofing, malicious containers, decompression bombs, oversized files, path traversal, SSRF, origin exposure, hotlinking, cache poisoning, signed-token replay, unauthorized variants/downloads, tenant isolation and rate abuse.

## Observability

Track upload success/failure, processing duration/failure, origin requests, cache hit ratio, delivery latency, authorization denials, signed-token failures, bandwidth/egress and video playback failures. Do not log secrets, tokens or unnecessary sensitive media metadata.
