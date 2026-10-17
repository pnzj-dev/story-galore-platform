# StoryGalore AI Policy Engine

## Purpose

All AI generation, provider selection, model selection and adult-content access decisions pass through one server-side policy engine. No UI, MCP agent, provider adapter or user-hosted endpoint can bypass it.

## Orthogonal dimensions

```text
Execution location: CLOUD | USER_HOSTED
Billing mode:        PLATFORM_CREDITS | BYOK | USER_HOSTED
Adult policy:        ADULT_ALLOWED | ADULT_NOT_ALLOWED | ADULT_REQUIRES_VERIFICATION
```

`USER_HOSTED` never implies adult permission. Adult permission is evaluated for the exact provider/model/product/workflow and applicable terms.

## Global platform controls

Admin controls are server-side configuration/feature flags and are independently auditable:

- `adultCatalogEnabled`
- `adultGenerationEnabled`
- `adultDiscoveryEnabled`
- `adultRecommendationsEnabled`
- `adultSearchEnabled`
- `aiGenerationEnabled`
- `byokEnabled`
- `userHostedAIEnabled`
- `imageGenerationEnabled`
- `videoGenerationEnabled`
- emergency provider kill switches

Turning adult catalog visibility off hides/rejects public adult surfaces without deleting creator drafts, revisions or approved stored assets.

## Decision order

```text
request
  -> authentication
  -> global feature/policy gates
  -> user age + geography + entitlement
  -> content rating + moderation/publication state
  -> capability check
  -> provider/model/workflow policy
  -> region/account/product constraints
  -> quota/rate/abuse checks
  -> execution planner
  -> provider
```

`ADULT_NOT_ALLOWED` and `ADULT_REQUIRES_VERIFICATION` are hard stops for adult generation.

## Adult catalog controls

Catalog visibility is separate from generation. Admin may disable public adult discovery/search/recommendations while preserving creator work. Disabling the catalog must not be implemented as deletion.

## Credit eligibility

Creator Studio credits are eligible only when the selected model is explicitly marked `creditEligible=true` by the StoryGalore-managed provider/model registry and the execution is funded by StoryGalore.

The following are always credit-ineligible:
- BYOK provider credentials
- user-hosted endpoints
- creator/workspace-owned provider registrations
- arbitrary OpenAI-compatible endpoints
- self-hosted Ollama/vLLM/LM Studio/LocalAI/ComfyUI execution

A BYOK or USER_HOSTED request MUST NOT call `ai_credit_reserve`, `ai_credit_settle`, or `ai_credit_refund`. If a request arrives with a credit charge for an ineligible execution, the Policy Engine MUST deny the credit operation and leave the generation uncharged.

## Provider/model registry

Policy records are model-specific where possible and contain:

- provider
- model
- API/product
- execution location
- protocol
- capabilities
- adult policy
- allowed/prohibited adult categories
- regions/account limitations
- source URLs
- policy version
- reviewedAt
- reviewAfter
- reviewer

Unknown or expired records resolve to `ADULT_REQUIRES_VERIFICATION`.

## User-hosted policy

For Ollama, vLLM, LM Studio, LocalAI, ComfyUI and compatible endpoints, the actual model/workflow must be evaluated. StoryGalore cannot infer permission from the endpoint software. ComfyUI workflows require workflow/model/checkpoint/LoRA provenance where relevant.

## Fallbacks

Provider/model fallback is permitted only among candidates that independently satisfy all current policy checks. An adult-approved request may never silently fall back to an unapproved model.

## Audit

Every policy-sensitive decision records safe metadata: actor, agent, policy version, provider/model, decision, reason code, correlation ID and timestamp. Never record secrets or unnecessary prompts.

## Dynamic policy requirement

AI policy is runtime configuration, not deployment configuration. Provider/model policy, adult switches, BYOK/user-hosted switches, capability enablement and emergency kill switches MUST be hot-reloadable through the Dynamic Configuration Service described in `docs/DYNAMIC_CONFIGURATION.md`.

No MCP Worker, Astro site, Go worker or Cloudflare Workflows worker restart may be required for these policy changes to take effect.
