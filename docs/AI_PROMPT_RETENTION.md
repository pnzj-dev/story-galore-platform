# AI Prompt Retention Policy

Status: draft (for privacy/legal review before enablement of non-minimal retention).

## Scope

Applies to AI generation prompts submitted to StoryGalore-managed models, and to their derived provenance records.

## Regulatory alignment

This policy is designed to be compatible with the principal privacy regimes:

- **Europe — GDPR**: purpose limitation, data minimisation, storage limitation, right to erasure, accountability.
- **North America — CCPA/CPRA (California)**: right to delete, right to know, data minimisation, no retention beyond the disclosed purpose.
- **Asia — PIPL (China) / PDPA (Singapore)**: data minimisation, purpose limitation, storage limitation, consent and deletion obligations.

## Principles

1. **Purpose limitation** — prompts are processed solely to (a) fulfil the generation request, (b) record provenance, and (c) support audit/abuse review. Prompts are **not** used for model training unless a separate, explicit, documented opt-in is obtained.
2. **Data minimisation** — only the prompt text necessary to serve the request is stored; nothing more.
3. **Storage limitation** — prompts are retained for a bounded period and then redacted/deleted.
4. **Right to erasure** — creators may request prompt deletion, honoured within a defined SLA and propagated to derived records.
5. **Lawful basis / notice** — creators are informed, at the point of submission, that the prompt is stored, why, and for how long.

## Retention tiers

| Tier | Content | Retention |
|---|---|---|
| Active prompt | full prompt text, needed to serve the request | until the generation reaches a terminal state (COMPLETED / FAILED / CANCELLED) |
| Provenance prompt | full prompt text, for audit/abuse | **30 days** after terminal state, then redacted to a content hash + metadata only |
| Redacted record | content hash + provider/model + timestamps (no raw text) | retained per the general audit policy |
| Erasure request | all raw prompt text across active + provenance tiers | deleted within **30 days** of a verified request |

## What is never stored

- Raw credentials, API keys, authorization tokens, or secret endpoint tokens.
- Prompts classified as containing sensitive personal data (per the platform data classification) without a lawful basis and explicit notice.

## Cross-border transfers

Prompt processing may occur in any of the platform's supported regions. Transfers out of a user's region follow the applicable mechanism (e.g. EU Standard Contractual Clauses for GDPR, contractual safeguards for PIPL/CCPA).

## Implementation notes

- The `prompt` field on `studio_generation_requests` is the active prompt.
- A scheduled retention job redacts prompts whose generation reached a terminal state more than 30 days ago, replacing the raw text with a one-way content hash.
- Erasure requests propagate to `studio_generation_requests.prompt` and any derived `ai_generation_outputs` that embed prompt text.
- Analytics/observability events must not contain raw prompt content (already enforced by the analytics projection allowlist).
