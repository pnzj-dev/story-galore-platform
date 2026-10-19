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

Workers AI is billed in **neurons**: **$0.011 / 1,000 neurons**, with a **10,000-neuron/day free allocation** on the Workers plan.

| targetType | default model | indicative cost / generation | neurons |
|---|---|---|---|
| STORY_TEXT / DIALOGUE | `@cf/meta/llama-3.1-8b-instruct-awq` | ~$0.0004 (1K in + 1K out) | ~35K neurons / M tokens |
| STORY_TEXT (cheap/draft) | `@cf/meta/llama-3.2-1b-instruct` | ~$0.0002 | ~18K neurons / M tokens |
| IMAGE (future) | `@cf/black-forest-labs/flux-1-schnell` | ~$0.00005 / 512² tile | ~4.8 neurons / tile |

## StoryGalore credit price (cost-plus, profitable)

- Flat **`creditCost` = 1 credit ($0.01) per text generation** in V1.
- Against ~$0.0004 of raw Workers AI cost, that is **~25× the raw cost** (and effectively ~100% margin once the 10K-neuron/day free tier absorbs the first generations). Target gross margin remains ≥ 60% with room to spare.
- Per-model `creditCost` (e.g. 1B = 1 credit, 8B = 2 credits) is a later refinement.

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
