# Data Retention Contract

Retention is a policy attribute, not an implicit database default. Every persisted domain entity MUST declare retention class and deletion behavior.

| Data | Default lifecycle | Deletion rule |
|---|---|---|
| Active account/content | while active | user/creator deletion workflow |
| Draft revisions | while creator retains drafts + configured recovery window | propagate deletion |
| Private messages | according to product/legal retention policy | delete/redact according to contract |
| Analytics aggregates | versioned retention window | expire/rebuild as permitted |
| Operational logs | bounded operational window | automated expiry |
| Audit evidence | policy/legal retention | restricted immutable retention |
| Financial ledger/receipts | legal/accounting retention | restricted retention; not silently erased |
| Backups | bounded backup lifecycle | cryptographic/backup expiry; deletion propagates on restore |

Exact durations MUST be supplied by the deployed jurisdictional/legal configuration before production. No implementation may invent a legal retention period.
