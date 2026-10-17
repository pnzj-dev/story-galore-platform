# Appwrite Feature Map

This project intentionally uses a broad set of Appwrite capabilities.

| Appwrite capability | Use in this platform |
|---|---|
| Auth / Account | Login, signup, OAuth, passwordless, sessions, MFA, recovery |
| Users API | Admin user management, support operations |
| User labels | Subscriber/creator/moderator cohorts where useful |
| User preferences | Reader settings, notification preferences, UX settings |
| User impersonation | Restricted support workflow with audit trail |
| Teams | Creator collaboration and internal staff roles |
| TablesDB | Core relational/transactional domain |
| DocumentsDB | Flexible AI/config/event payloads |
| VectorsDB | Semantic search and recommendations |
| Embeddings | Comic/series/profile/prompt embeddings |
| Storage | Comic pages, covers, creator assets, AI outputs, exports |
| Storage folders | Virtual entity/version organization |
| File/bucket permissions | Media access control |
| Messaging | Email/SMS/push and scheduled messages |
| Messaging topics | Notification subscriptions |
| Realtime | Reader/comments/generation/progress/admin live updates |
| Functions | Synchronous handlers, webhooks, schedules and integrations |
| Function schedules | Reconciliation, cleanup, analytics aggregation |
| Function events | Storage/payment/domain-event processing |
| Sites | Public and admin deployments |
| Firewall | API/site/function rate limiting, challenge, deny, redirect, attack mode |
| Avatars | Initials, QR/MFA, flags, payment icons, image utilities |
| Locale | Regional/language-aware behavior where useful |
| CLI | Project/resource deployment |
| Terraform | Official infrastructure path for resources not represented by CLI initialization |
| MCP | Developer/agent access to Appwrite; application MCP remains behind authorization |

## Media-specific Appwrite usage

- Storage buckets/folders separate original media from previews/playback variants.
- Functions perform media authorization, processing orchestration and playback authorization.
- Realtime reports long-running media processing progress to creator/admin UIs.
- TablesDB stores media metadata and publication state; DocumentsDB stores flexible processing/provider payloads.
- VectorsDB stores semantic representations for cross-media discovery and recommendations.
- Messaging notifies creators when media processing/generation completes or fails.

## Important distinctions

### Labels vs entitlements

Labels can make Appwrite permissions convenient, for example `subscriber` or `creator`, but they are not the authoritative billing state.

Authoritative access comes from:

```text
subscription
  -> plan
  -> entitlement rules
  -> content classification
  -> authorization decision
```

### Teams vs plans

Teams represent collaboration/roles. Plans represent commercial entitlements.

### Appwrite Firewall vs application authorization

Firewall is an edge/network control. It is not a substitute for row/file permissions or domain authorization.

### Storage permissions vs entitlement engine

Storage permissions provide a strong platform-level barrier, but the server must issue/allow access only after entitlement checks for protected media.


## Notification Service

The canonical notification architecture, command/query surface, inbox state, channel delivery state, privacy policy, retry rules, UI requirements, and production blockers are defined in `docs/NOTIFICATION_SYSTEM.md` and `contracts/deterministic/notifications/`. Logical notification tables are listed in `backend/appwrite/tables/desired-schema.json`; these are desired contracts, not generated/provisioned Appwrite resources.
