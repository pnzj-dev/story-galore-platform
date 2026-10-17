# Search, Recommendation and Cache Authorization Contract

Candidate retrieval is never equivalent to authorization.

Required order:

`candidate retrieval -> authorization filtering -> age/content policy -> entitlement -> ranking/presentation -> cache`

The same rule applies to search, recommendations, autocomplete, vectors, thumbnails, CDN objects, OG metadata, notifications, and offline materialization.

A cache entry MUST NOT widen the authorization scope of the underlying resource.
