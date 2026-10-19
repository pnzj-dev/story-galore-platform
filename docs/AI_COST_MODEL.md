# AI Generation Cost Model

Status: draft (for business sign-off before implementation of dynamic metering).

## Principles

- Creator Studio credits are a payment/funding mechanism for **StoryGalore-managed models only**. They never apply to BYOK or user-hosted inference (those remain the responsibility of the credential/endpoint owner).
- The platform sells generation capacity at a **cost-plus margin**, expressed in a stable credit unit so creators get a predictable price while the platform absorbs provider cost variability.
- Profitability is a first-class constraint: every `creditCost` must cover provider raw cost, platform infrastructure, operating overhead, and a target gross margin.

## Credit denomination

- **1 StoryGalore credit = $0.01 USD** (100 credits = $1.00).
- Credits are purchased in bundles (future) and are non-refundable **except** when a generation fails before completion (see settlement lifecycle).

## Per-generation cost (`creditCost`)

Each registered provider declares an integer `creditCost` — the all-in price to the creator for one generation, set by the platform. It is constructed to cover:

1. provider raw API cost,
2. platform infrastructure (compute, storage, egress, moderation),
3. platform operating overhead (support, policy, observability),
4. **target gross margin ≥ 60%** (i.e. `creditCost` ≥ ~2.5× the provider raw cost).

## V1 defaults (text generation)

| targetType | creditCost | indicative provider raw cost | implied margin |
|---|---|---|---|
| STORY_TEXT, DIALOGUE | 1 credit ($0.01) | < $0.005 | ≥ 2× |
| PAGE / IMAGE (future) | 5–20 credits | $0.02–0.08 | ≥ 2× |
| VIDEO (future) | 100+ credits | $0.30+ | ≥ 2× |

Rationale: a short text completion costs the provider well under half a cent; pricing it at 1 credit ($0.01) yields a healthy margin while remaining cheap enough to drive creator adoption.

## Settlement lifecycle

- **RESERVE** — on credit-eligible `generation_create`, reserve the resolved `creditCost` (the default credit-eligible provider's `creditCost`, falling back to 1 credit when no provider is registered).
- **SETTLE** — on `generation_complete`, settle the reserved amount (the creator has consumed the credits; the platform recognizes the revenue).
- **REFUND** — on `generation_fail` or `generation_cancel`, refund the reserved amount (creators are not charged for failed/cancelled work).

## Future refinements (not V1)

- **Dynamic metering**: settle the *actual* provider cost (tokens, images, seconds) instead of a flat `creditCost`.
- **Per-model pricing**: image/video priced separately from text.
- **Credit bundles**: bulk purchases at a discount (requires the billing/payment subsystem).
