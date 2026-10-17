# ADR 0004 — Provider-neutral AI execution and BYOAI

## Decision

Represent AI providers independently from model capabilities and support two execution locations: `CLOUD` and `USER_HOSTED`. Support three billing modes: `PLATFORM_CREDITS`, `BYOK` and `USER_HOSTED`. Only StoryGalore-managed models are credit eligible; BYOK and USER_HOSTED are never credit eligible.

Individual providers/models, including creative models such as Seedance, are ordinary provider/model integrations. User-hosted systems such as Ollama, vLLM, LM Studio, LocalAI and ComfyUI are protocol adapters behind the `USER_HOSTED` execution location.

## Rationale

This avoids coupling the domain to provider names or modality assumptions and permits creators to run models on infrastructure they control without moving inference into StoryGalore.

## Consequences

- Provider/model capability discovery is required.
- Credential handling is a security subsystem.
- User-hosted endpoints require SSRF, TLS, authentication and availability controls.
- BYOK provider costs must remain separate from StoryGalore provider spend and credit accounting.
- The same StoryGalore entitlement/moderation/provenance pipeline applies to both modes.
