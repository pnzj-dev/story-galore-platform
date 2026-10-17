# Studio Validation and Publication

Validation is deterministic and server-authoritative. Required checks include schema integrity, references, geometry, media readiness, moderation, age/content policy, AI provenance, publication permissions and entitlement configuration.

`BLOCKING` failures prevent submission/publication. `WARNING` and `INFO` do not.

Publication always references an approved revision and creates an immutable publication snapshot. Scheduled publication stores the approved revision/snapshot reference rather than reading mutable draft state at execution time.
