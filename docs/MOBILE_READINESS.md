# Mobile Readiness

V1 must remain ready for Android and iOS without requiring a domain rewrite.

Required contracts: auth, reader, offline, downloads, notifications, messaging, analytics, deep links, device sessions.

Mobile-specific adapters may use native secure storage, push services, local databases, and OS lifecycle APIs. Server-side authorization remains authoritative.

Required future capabilities: App Links/Universal Links, push notifications, multi-device sessions, reading-progress sync, offline reading, protected downloads, and client-version telemetry.
