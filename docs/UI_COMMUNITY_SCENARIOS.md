# Community UI Scenarios — V1

Required journeys:

1. Reader opens comments on a free publication and posts a comment.
2. Reader replies to a comment and receives the reply notification.
3. Reader mentions another user and the mention creates a notification.
4. Reader tries to comment on protected content without entitlement and is denied without content leakage.
5. User reports a comment and sees pending-review feedback.
6. User blocks another user and their comments/messages are no longer actionable for the blocker.
7. User opens Messages, receives a message in Realtime, and sees unread count update.
8. User sends a DM, loses connectivity, reconnects, and the message is sent exactly once.
9. User receives a message request and accepts it.
10. User declines a message request and cannot be contacted through that request.
11. User configures messaging to followers/subscribers/requests/nobody and server enforcement matches UI.
12. Creator receives a message request under creator messaging settings.
13. User reports a message; the report enters moderation without exposing unnecessary reporter data.
14. Support attempts to access private message content without capability and is denied/audited.
15. Authorized moderation workflow hides a message/comment and clients reconcile the state through Realtime + server refresh.
16. Deep link opens a specific comment/conversation and handles removed/not-found content safely.
17. Notification preferences suppress configured channels without disabling the underlying moderation/audit event.
