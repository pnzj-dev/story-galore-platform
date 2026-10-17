# Community & Messaging — V1 Contract

Community is split into two related but distinct capabilities: content comments and user messaging. Both share authentication, authorization, policy, moderation, notifications, Realtime, rate limiting and audit, but they have different data lifecycles and privacy rules.

## Comments

Comments belong to a publication or addressable reader location (episode/page/panel when supported). Replies are comments with a parent comment. V1 supports:

- create/edit/delete comment;
- threaded replies;
- reactions;
- @mentions with autocomplete;
- report comment;
- block author;
- moderation states `VISIBLE`, `PENDING_REVIEW`, `HIDDEN`, `REMOVED`;
- cursor pagination and deep links;
- Appwrite Realtime updates;
- notifications for replies and mentions.

A user must already be authorized to access the referenced publication/location before reading or creating protected comments. Comment access never grants content access.

## Messaging

Messaging is a first-class conversation system, not a single `messages` table.

```text
Conversation
├── participants
├── settings
├── message requests
└── messages
    ├── text
    ├── attachments
    ├── replyTo
    └── moderation metadata
```

V1 supports 1:1 direct messages. The data model remains group-capable so future group conversations do not require a migration of the conceptual model.

User experience:

- `/messages` Inbox;
- message requests;
- unread counts;
- conversation view;
- reply/send;
- attachment capability where explicitly enabled;
- mute/archive;
- block/report;
- recipient messaging preferences;
- creator-specific inbound-message controls;
- Appwrite Realtime for new messages/read state;
- notification preferences and delivery.

No separate creator account is required. A creator is still a user; creator messaging policy can restrict who may initiate contact.

## Message requests and anti-spam

Recipient policy is evaluated before creating a conversation or sending a message:

```text
actor authenticated
 -> recipient exists and is active
 -> actor not blocked by recipient / recipient not blocked by actor
 -> recipient messaging policy
 -> relationship/subscription requirement if configured
 -> message request rules
 -> rate/abuse limits
 -> content safety/moderation policy
 -> send
```

Recipient settings may be `EVERYONE`, `FOLLOWERS`, `SUBSCRIBERS`, `FOLLOWING`, `REQUESTS_ONLY`, or `NOBODY`, subject to platform policy.

Creating many conversations or repeatedly contacting creators is rate-limited and abuse-scored. Internal thresholds are not exposed to clients.

## Privacy and moderation

Private messaging is not a public feed. Administrative/support access to message content is capability-restricted, reason-coded, least-privilege and audited. The platform does not assume unrestricted routine staff access to private conversations.

V1 moderation supports:

- user report;
- message/conversation report;
- spam/abuse detection;
- policy classification;
- human review where required;
- account sanctions;
- block/mute;
- retention/deletion policy.

Applicable illegal-content and child-safety obligations must be enforced according to the deployment jurisdiction and current policy. The implementation must not invent legal requirements; policy configuration and legal review are authoritative.

## Attachments

Attachments use the same protected media delivery principles as downloads:

- no unrestricted source bucket URLs;
- authorized upload/download references;
- file type/size limits;
- malware/safety processing where applicable;
- sender/recipient authorization checked on access;
- retention tied to message lifecycle.

Attachments are disabled until their complete security and moderation path is implemented.

## Realtime and consistency

Appwrite Realtime is a delivery mechanism, not the source of truth. On reconnect, the client reconciles from the server using cursors and message IDs.

Every send mutation includes a durable `messageId` and idempotency key. Retries must not duplicate a message. Read receipts are also idempotent.

Offline message composition may queue in IndexedDB. The client must display `pending` until the server acknowledges the message; it must never display an unsent message as delivered.

Cloudflare Workflows is not used for ordinary comments or messages. It is reserved for long-running bulk moderation, migration, retention cleanup, or other durable operations that meet the workflow criteria.

## Notifications

Events include:

- `comment_reply`
- `comment_mention`
- `message_request`
- `message_received`
- `message_reply`
- `message_moderated`

Users control notification channels where supported. Notification content must not leak protected message/comment content to an unauthorized channel or recipient.

## Analytics

Record aggregate events such as comment created, reply created, reaction, report, conversation created, message sent, message request accepted/declined, delivery/notification outcomes and moderation outcomes.

Analytics must not contain raw private message bodies, private attachment bytes, signed URLs, credentials or unnecessary personal data.

## V1 acceptance criteria

- A protected publication's comments cannot be used to bypass publication entitlement.
- A blocked user cannot initiate a new DM with the blocker.
- Recipient messaging preferences are enforced server-side.
- Message retries are idempotent and do not create duplicates.
- Realtime disconnect/reconnect reconciles missing messages.
- Unauthenticated users cannot send messages.
- Message request spam is rate-limited and abuse-policy aware.
- Staff/support cannot access private message content without the required capability and audit trail.
- Reports enter moderation without exposing reporter identity unnecessarily.
- Notification delivery does not leak private content.
- Deleted/removed messages follow the documented retention and moderation rules.
- No Cloudflare Workflows workflow is introduced for ordinary message/comment CRUD.
