# Disaster Recovery and Restore Drill Contract

Backups are considered operationally valid only when restore procedures have been exercised.

Restore validation covers, as applicable:

1. Appwrite authoritative domain data
2. Storage objects and metadata
3. indexes/search projections
4. vector projections
5. analytics projections
6. Cloudflare Workflows workflow recovery/reconciliation state
7. configuration/policy versions

Recovery must meet the declared V1 RPO/RTO targets. Integrity checks and post-restore authorization checks are mandatory before reopening traffic.
