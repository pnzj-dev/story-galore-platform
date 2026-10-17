# StoryGalore V15 — UI E2E Contract

The UI E2E suite is a release gate, not a visual smoke test. It must execute against a real staging deployment with real Appwrite and Cloudflare Workflows where required, payment sandbox/adapters, and AI provider test doubles only where external provider calls cannot safely be made.

## Test layers

### 1. Browser contract tests

Validate routes, accessibility semantics, keyboard navigation, responsive breakpoints, loading/empty/error states, and stable `data-testid` hooks.

### 2. Journey tests

Execute the journeys in `docs/UI_SCENARIO_MATRIX.md` end to end. Assertions must validate both visible UI state and authoritative backend state.

### 3. Failure-injection journeys

Repeat critical journeys while injecting dependency failures: Appwrite timeout/partial failure, Cloudflare Workflows unavailable, provider timeout/429/5xx, storage interruption, duplicate webhook, stale configuration, duplicate inbox/outbox delivery and worker crash after external side effect.

### 4. Security journeys

Verify tenant isolation, capability authorization, age/entitlement checks, SSRF prevention, protected asset delivery, impersonation leases, BYOK secret redaction and search/recommendation post-retrieval authorization.

## Stable UI test contract

Use semantic locators first. Use stable `data-testid` attributes only for elements whose semantic role/name is insufficient.

Required IDs/namespaces include:

- `auth.*`
- `onboarding.*`
- `creator.draft.*`
- `creator.editor.*`
- `creator.ai.*`
- `creator.provider.*`
- `reader.*`
- `reader.progress.*`
- `reader.comment.*`
- `reader.subscription.*`
- `adult.*`
- `admin.dashboard.*`
- `admin.moderation.*`
- `admin.configuration.*`
- `admin.policy.*`
- `admin.payments.*`
- `admin.ads.*`
- `ops.workflow.*`
- `shared.error.*`
- `shared.offline.*`

Do not encode database IDs, timestamps, localized copy, or implementation-specific CSS classes in selectors.

## Evidence required for a passing journey

A passing journey must prove:

- route reached;
- expected UI state rendered;
- expected backend mutation/read occurred;
- authorization/entitlement decision was correct;
- asynchronous operation reached the expected terminal state;
- no duplicate side effect occurred;
- telemetry did not leak secrets or sensitive payloads;
- refresh/deep-link recovery works when the journey requires it.

## Release rule

A journey is not `E2E_PASS` until it passes in staging. A test that only mounts a component, mocks every backend call, or checks that a button exists does not satisfy this contract.
