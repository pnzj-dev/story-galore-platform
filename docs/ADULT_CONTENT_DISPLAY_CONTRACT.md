# Adult Content Display Contract — V1

## Purpose

`ADULT_18_PLUS` content is opt-in. It is never displayed, recommended, searched, previewed, linked, cached for presentation, or otherwise disclosed by default.

## Required conditions

Adult content may be displayed only when **all** conditions are true:

1. The authenticated user is legally/operationally eligible for adult content and required age assurance has succeeded.
2. The user has the required paid entitlement for the content.
3. The user's explicit adult-content display preference is `ENABLED`.
4. The global adult-content policy is enabled.
5. The content is publishable and not blocked by moderation/policy.
6. The requested surface/action is allowed by the Policy Engine.
7. Any applicable jurisdiction, region, provider, account, or product policy allows the operation.

Unknown, missing, stale, expired, or unavailable adult-preference state MUST fail closed to `HIDDEN`.

## Explicit opt-in

The preference is an explicit user action. It is not inferred from:

- age verification alone;
- paid subscription/purchase alone;
- previous adult-content access;
- search queries;
- clicks or recommendations;
- browser/device state;
- creator status;
- administrator impersonation.

A paid entitlement therefore grants **eligibility to opt in**, not automatic adult display.

## Anti-disclosure invariant

When the preference is not enabled, adult content MUST NOT be disclosed through secondary surfaces, including:

- home/discovery feeds;
- search results, autocomplete, filters, facets, and counts where they would reveal adult inventory;
- recommendations and related content;
- series/creator pages and listings;
- reader previews and thumbnails;
- notifications and email/push payloads;
- deep links and share previews;
- sitemap/SEO/structured metadata;
- API responses;
- MCP tools and agent projections;
- cached/projection/search/vector results;
- offline/download catalogs.

Where appropriate, systems SHOULD omit the adult item entirely rather than returning a visible `restricted` placeholder that reveals its existence. Count/facet leakage MUST also be prevented.

## Authorization order

For adult display, authorization is evaluated server-side in this order:

`authentication -> age eligibility -> paid entitlement -> explicit adult preference -> global policy -> content/moderation policy -> capability/action policy -> jurisdiction/provider/product policy -> rate/abuse controls -> display authorization`

The client MUST NOT be the authority for any of these checks.

## Preference model

The canonical user setting is:

`adultContentDisplay: DISABLED | ENABLED`

Default: `DISABLED`.

Changing this preference is an auditable security/privacy-sensitive preference change. It MUST NOT grant age eligibility or an entitlement by itself.

## Cache and projection rules

Adult visibility decisions are user-contextual. Public/shared caches MUST NOT cache an adult item in a way that can bypass the preference check.

Search, recommendation, vector, CDN, notification, and projection layers MUST apply authorization after candidate retrieval and before disclosure. User-specific authorization state MUST be included in any safe cache key where caching is permitted.

## Logging and analytics

Do not log or emit analytics that reveal adult titles, raw adult content identifiers, thumbnails, private content metadata, or the user's adult preference unnecessarily. Policy decisions may record the decision ID, policy version, action, result, and minimal reason code.

## Tests required for V1

The test suite MUST prove:

- paid + age eligible + preference disabled => hidden;
- paid + age eligible + preference enabled => eligible for display;
- free + preference enabled => hidden;
- underage/not eligible + preference enabled => hidden;
- unknown preference => hidden;
- global adult policy disabled => hidden;
- search/recommendation/API/MCP do not leak adult content when disabled;
- notification/deep-link/share metadata do not disclose adult content when disabled;
- cache/projection cannot bypass the decision;
- toggling the preference does not change payment or age status.
