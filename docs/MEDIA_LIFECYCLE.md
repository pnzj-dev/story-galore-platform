# Media Lifecycle

```text
UPLOADING -> UPLOADED -> PROCESSING -> READY
                                  \-> FAILED -> PROCESSING
READY -> RESTRICTED / QUARANTINED -> READY
READY|RESTRICTED|QUARANTINED|FAILED -> DELETED
```

Appwrite Storage is the origin for every lifecycle state. Cloudflare Workflows coordinates durable processing and deletion propagation; it is not the source of truth.

A media asset cannot be distributed until it is READY and all applicable publication, moderation, age, entitlement and policy checks allow access.
