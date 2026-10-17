# Media Security Contract

## Origin protection

Appwrite Storage is never treated as a public bypass around StoryGalore authorization. Protected media is delivered through Cloudflare PRIMARY distribution using short-lived authorization artifacts.

## Upload security

Validate authenticated actor, tenant, declared size/type, upload scope and expiry before upload. After upload, inspect actual MIME/container, size and checksum. Reject malformed, oversized or disallowed content before publication.

## Delivery security

Protected delivery requires a current Policy Engine decision. Authorization artifacts are scoped to media and variant, expire, and cannot grant access to another tenant/resource. CDN caching must not bypass authorization or allow cache poisoning.

## Adult media

ADULT_18_PLUS remains hidden unless all existing adult-content requirements are satisfied, including authentication, age eligibility/verification, required entitlement, explicit adult preference, global policy, moderation and jurisdiction. This applies to originals, derivatives, thumbnails, previews, OG metadata, downloads and streaming.

## Deletion

Deletion/restriction revokes future delivery authorization and triggers Cloudflare invalidation plus downstream deletion propagation. Eventual cleanup failures must be retried and surfaced operationally.
