# AI Generation Cost Model

Status: draft (for business sign-off before enablement of dynamic metering).

## Principles

- Creator Studio credits are a payment/funding mechanism for **StoryGalore-managed models only**. They never apply to BYOK or user-hosted inference.
- StoryGalore-managed generation runs on **Cloudflare Workers AI** (native `env.AI` binding): no external provider key, no egress, no SSRF surface.
- BYOK / USER_HOSTED cover every model Workers AI does not provide (Anthropic, OpenAI, Grok, Gemini, self-hosted, …); the creator brings their own key/endpoint and the platform charges a separate platform fee.

## Credit denomination

- **1 StoryGalore credit = $0.01 USD** (100 credits = $1.00).
- Credits are purchased in bundles (future) and are non-refundable **except** when a generation fails before completion (see settlement lifecycle).

## StoryGalore-managed cost basis (Workers AI)

Workers AI is billed in **neurons** (Cloudflare-hosted models, **$0.011 / 1,000 neurons**, 10,000-neuron/day free) or in **units** (third-party models).

| targetType | default model | indicative cost / generation |
|---|---|---|
| STORY_TEXT / DIALOGUE (default) | `@cf/qwen/qwen3.8-27b` | ~$0.0037 (1K in + 1K out: $0.45/M in, $3.20/M out) |
| STORY_TEXT (cheap/draft) | `@cf/zai-org/glm-4.7-flash` | ~$0.00046 (1K in + 1K out: $0.06/M in, $0.40/M out) |
| IMAGE (default) | `@cf/black-forest-labs/flux-2-klein-4b` | ~$0.00035 / 512² tile |
| IMAGE (high quality) | `@cf/black-forest-labs/flux-2-dev` | ~$0.00062 / 512² tile · step |
| VIDEO (feature-flagged, future) | `xai/grok-imagine-video` | $0.05–0.07 / second (third-party) |

## StoryGalore credit price (cost-plus, profitable)

- Text generation: flat **`creditCost` = 1 credit ($0.01)**, against ~$0.0005–0.0037 of raw cost (≥ 2.7× margin, and effectively higher once the free tier applies).
- Image generation: **1 credit** against ~$0.00035–0.00062 of raw cost (≥ 16× margin).
- Video generation (future, feature-flagged): requires its own higher `creditCost` — a 5-second clip at $0.05–0.07/s is ~$0.25–0.35, so ~**30 credits** per clip, not 1.

Per-model `creditCost` is the intended refinement so the price tracks the model (e.g. GLM-4.7-Flash = 1 credit, Qwen 3.8 27B = 2 credits, video = 30+ credits).

## BYOK / USER_HOSTED platform fee

For non-Cloudflare models the platform does not pay the provider, but still supplies the durable workflow, Policy Engine, moderation, provenance, and retention. So it charges a **platform fee** rather than a credit markup:

- V1: a flat platform fee per generation (e.g. 1 credit), applied regardless of provider.
- Later: a BYOK subscription tier or a percentage-of-provider-spend fee.

The creator's own provider key is tenant-scoped and stored by reference (never as a raw secret in the DB).

## Settlement lifecycle

- **RESERVE** — on credit-eligible `generation_create`, reserve the resolved `creditCost` (the default credit-eligible provider's `creditCost`, falling back to 1 credit).
- **SETTLE** — on `generation_complete`, settle the reserved amount.
- **REFUND** — on `generation_fail`/`cancel`, refund the reserved amount. BYOK/USER_HOSTED has no reserve, so no settle/refund.

## Future refinements (not V1)

- **Dynamic metering**: settle the *actual* Workers AI neuron/token cost instead of a flat `creditCost`.
- **Per-model pricing**: image/video priced separately from text.
- **Credit bundles**: bulk purchases at a discount (requires the billing subsystem).
