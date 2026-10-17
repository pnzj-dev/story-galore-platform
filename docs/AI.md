# AI System

## Workflow

```text
Prompt Builder
  -> Project context
  -> Story Bible
  -> Characters
  -> Worlds
  -> Style
  -> Constraints
  -> entitlement/policy
  -> execution planner
  -> PLATFORM_CREDITS, BYOK or USER_HOSTED
  -> AI Generation Job
  -> Output assets
  -> Draft revision
  -> Review
  -> Publication
```

## Execution modes

### StoryGalore credits

Creator Studio credits are a payment/funding mechanism for **StoryGalore-managed AI models only**. They are never a generic wallet balance and never apply to BYOK or user-hosted inference.

```text
request
 -> entitlement/policy
 -> verify StoryGalore-managed model
 -> reserve credits
 -> create job
 -> generate
 -> record actual usage/cost
 -> settle or refund
```

### BYOK / user-hosted AI

```text
request
 -> entitlement/policy
 -> verify external funding
 -> resolve authorized credential/endpoint reference
 -> create job
 -> generate
 -> record usage/provenance
```

**No StoryGalore credits are reserved, settled or refunded for BYOK or user-hosted execution.** Provider charges remain the responsibility of the credential/endpoint owner.

## Provider architecture

Provider identity and model capability are separate concerns. Do not create special branches for individual models/providers.

Providers declare:

- execution location: `CLOUD` or `USER_HOSTED`
- protocol
- authentication
- models
- capabilities
- health
- streaming/cancellation support

User-hosted means the model runs on infrastructure controlled by the creator/user, not on StoryGalore infrastructure. Examples include Ollama, vLLM, LM Studio, LocalAI and ComfyUI behind supported adapters.

Cloud integrations may include common providers such as OpenAI, Anthropic, Google Gemini, Mistral, DeepSeek, xAI, OpenRouter and media/creative providers such as Higgsfield, Runway, fal.ai, Replicate and other approved adapters. These are ordinary provider/model integrations.

Higgsfield is a media-oriented provider adapter, not an LLM provider. Its current official catalog exposes image/video models including Seedance, Kling, MiniMax, Wan, LTX, Grok Imagine, Soul, Ideogram, Recraft, PixVerse and others. The catalog MUST remain dynamic and model policy MUST be verified against current official provider documentation; do not hard-code this list as the authoritative catalog.

Verify current provider API/SDK contracts from official documentation during implementation.

## AI job states

```text
QUEUED
PROCESSING
COMPLETED
FAILED
CANCELLED
```

## Security

- Credentials are server-side only.
- Never persist raw credentials in normal Appwrite records.
- Never put raw credentials in Cloudflare Workflows workflow arguments/history.
- Never log API keys, authorization headers or secret endpoint tokens.
- Creator credentials/endpoints are tenant-scoped.
- User-hosted endpoints are treated as untrusted external infrastructure.
- SSRF protections and outbound endpoint policy are mandatory for server-side connectors.
- BYOK never bypasses moderation, age/content policy, entitlement, rate limits or audit.

## Provenance

Persist:

- billing mode
- execution location
- provider/model
- protocol
- model version when available
- prompt and references according to privacy/provenance policy
- generation parameters
- seed where supported
- creator/user
- project
- timestamps
- usage/cost metadata
- output asset IDs
- provider request/job reference when safe

## Analytics

Separate StoryGalore-funded usage from BYOK usage. Do not count BYOK provider charges as StoryGalore provider spend.

Track provider/model, capability, execution location, billing mode, latency, success/failure, usage and platform cost with privacy-safe telemetry.

## Safety

All generated content goes through the same moderation/classification pipeline as uploaded content.

Adult generation must be separately gated by account entitlement, age eligibility and current product policy.

## Central Policy Engine

All AI requests use the server-side Policy Engine. Execution location, billing mode and adult policy are independent dimensions. User-hosted inference is never implicitly adult-approved.

Admin has independent server-side controls for adult catalog visibility, adult generation, adult discovery, adult recommendations and adult search. These controls hide/reject affected public surfaces without deleting creator work.

Provider/model policy is model-specific where possible, time-bounded, auditable and reverified. Unknown or expired adult policy is denied until reviewed.
