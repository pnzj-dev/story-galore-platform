# AI Provider & Model Registry

Admin manages the canonical StoryGalore registry for providers, models, capabilities and policy status.

## Provider metadata

- providerId / displayName
- executionLocation (`CLOUD` / `USER_HOSTED`)
- protocol
- enabled/disabled/maintenance status
- supported capabilities
- allowed environments
- agent access policy
- rate/cost limits
- adult policy reference
- review status

## Model metadata

- providerId
- modelId
- displayName
- capabilities
- modality
- limits
- usage/pricing metadata where available
- adult policy record
- policy review/expiry
- model version/fingerprint when available

## Admin operations

- enable/disable provider
- maintenance mode
- disable individual model
- configure capability availability
- approve/revoke adult policy
- set review date
- emergency kill switch
- inspect health and usage

All mutations require RBAC, server-side authorization, confirmation for high-risk actions and audit events.


## V1 provider families

The registry is provider-neutral and dynamic. The following are initial adapter families, not an exhaustive or permanent model catalog:

### General LLM / multimodal
- OpenAI
- Anthropic
- Google Gemini
- Mistral
- DeepSeek
- xAI
- OpenRouter

### Media / creative generation
- Higgsfield
- Runway
- fal.ai
- Replicate
- ComfyUI (user-hosted / workflow adapter)

Higgsfield is specifically supported as a media-oriented provider adapter. Its official API currently aggregates image/video models including Seedance, Kling, MiniMax, Wan, LTX, Grok Imagine, Soul, Ideogram, Recraft and PixVerse. Model availability changes; StoryGalore MUST discover/refresh the provider catalog and MUST NOT treat this list as a static source of truth. Current official Higgsfield documentation describes the API as a common interface for image and video models and provides model-specific API references.

### User-hosted / self-hosted
- Ollama
- vLLM
- LM Studio
- LocalAI
- ComfyUI
- OpenAI-compatible custom endpoints

## Billing classification

Each provider/model record MUST contain:
- `executionLocation`
- `ownerType`
- `creditEligible`
- `creditEligibilityReason`
- `billingModes`

Only StoryGalore-managed models explicitly marked `creditEligible=true` may use `PLATFORM_CREDITS`. BYOK and USER_HOSTED models MUST have `creditEligible=false`.
