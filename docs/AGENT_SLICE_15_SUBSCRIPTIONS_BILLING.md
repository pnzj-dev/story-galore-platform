# Agent Slice 15 — Subscriptions & Provider-Independent Billing

## Goal

Implement StoryGalore subscriptions as a first-class commerce domain with one provider-independent Subscription API. Support processors with native recurring billing and processors that only support one-time payments through merchant-managed renewal.

## Required reading

- `AGENTS.md`
- `DESIGN.md`
- `docs/PAYMENTS.md`
- `docs/SUBSCRIPTIONS.md`
- `docs/FINANCIAL_INVARIANTS.md`
- `docs/ENTITLEMENTS.md` when present; otherwise locate the entitlement contract in the domain registry
- `docs/STATE_MACHINE_CONTRACT.md`
- `docs/CLOUDFLARE_WORKFLOWS.md`
- `docs/DOMAIN_CONTRACT_REGISTRY.md`
- `contracts/domain/plan.schema.yaml`
- `contracts/domain/subscription.schema.yaml`
- `contracts/domain/subscription-renewal.schema.yaml`
- `contracts/domain/payment-provider-capabilities.schema.yaml`
- `contracts/state-machines/subscription.yaml`
- `contracts/subscription-billing-strategies.yaml`

## Requirements

### Subscription domain

- Keep `Plan`, `Subscription`, `Payment`, and `Entitlement` as separate authoritative records.
- Implement subscription lifecycle and versioning.
- Support trials, current billing periods, cancellation at period end, expiration, grace periods, plan changes, and renewal history.
- Never infer active entitlement solely from a client redirect or local subscription state.

### Provider capability negotiation

- Every payment provider declares capabilities.
- Never assume a provider supports subscriptions or recurring payments.
- Native recurring billing is selected only when the provider explicitly supports the required capabilities.

### Billing strategies

Support these strategies:

- `NATIVE_RECURRING`: provider owns recurring authorization and charges.
- `MERCHANT_MANAGED`: StoryGalore owns the subscription lifecycle and creates a new payment request for each renewal; the user must authorize/pay each renewal.
- `MANUAL`: the user explicitly starts renewal when they choose to continue.

Do not emulate automatic wallet debits or store credentials to manufacture recurring crypto payments when the provider does not support them.

### Unified application interface

Expose one `SubscriptionService` interface regardless of provider strategy:

- create subscription
- get subscription
- change plan
- cancel
- pause/resume where supported by the domain contract
- renew
- retrieve renewal/payment status

Provider-specific differences stay behind the billing strategy and payment adapter.

### Merchant-managed renewal

For processors that only support one-time payments:

1. Create the StoryGalore subscription after the initial payment is confirmed.
2. Schedule renewal processing around `currentPeriodEnd`.
3. Create a renewal payment request.
4. Notify the user.
5. Wait for authoritative provider confirmation.
6. Extend the subscription only after payment confirmation.
7. Extend the entitlement only after the subscription transition succeeds.
8. Apply the configured grace period when payment is not completed on time.

Use Cloudflare Workflows for the durable renewal workflow. Cloudflare Workflows is orchestration, not the source of truth.

### Financial invariants

- Payment success does not equal entitlement grant.
- Subscription state does not equal payment settlement.
- Provider webhooks and reconciliation are authoritative for provider-side payment status.
- All renewal creation and externally visible mutations are idempotent.
- Preserve provider IDs, payment IDs, subscription IDs, renewal IDs, correlation IDs, and audit history.

## Validation

- Validate all subscription/domain/state-machine contracts.
- Test native recurring and merchant-managed renewal paths.
- Test provider capability mismatch and fail-closed behavior.
- Test duplicate webhook/renewal events.
- Test failed renewal, grace period, expiration, cancellation, and plan changes.
- Test Cloudflare Workflows retry/resume without duplicate payment creation.
- Run repository build, typecheck, lint, unit tests, contract validation, and relevant E2E scenarios.
- Do not claim PASS if a required test or contract check is missing.

## Stop conditions

STOP and report if:

- a provider is treated as recurring when it does not advertise the capability;
- the implementation attempts automatic crypto-wallet debits without provider support;
- payment, subscription, or entitlement authority becomes ambiguous;
- Cloudflare Workflows is used as the source of truth;
- a renewal can be created twice because of retries/races;
- an existing contract is broken without an approved compatibility/migration path.
