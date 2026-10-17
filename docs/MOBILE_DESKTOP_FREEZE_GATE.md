# Mobile/Desktop Freeze Gate

PASS requires:
- clientPlatform supports WEB, ANDROID, IOS, DESKTOP;
- auth/session contracts are client-neutral;
- reader and reading-progress contracts are client-neutral;
- offline/download contracts are client-neutral;
- messaging/notification contracts are client-neutral;
- deep-link contract is client-neutral;
- analytics records client platform and app/client version;
- no authorization depends on browser-only state;
- no payment or entitlement truth is stored only on a client;
- client-specific storage is implemented as an adapter;
- future native apps can reuse the domain/API contracts without a backend rewrite.
