# Payment Architecture

## Goals

- Support adult-compatible providers.
- Support both fiat/card and crypto.
- Avoid vendor lock-in.
- Survive provider outages and underwriting/business changes.
- Keep subscription/entitlement state independent from provider implementation.

## Adapter boundary

```text
PaymentService
├── StripeConnectAdapter
├── NOWPaymentsAdapter
├── ZenPaymentsAdapter
└── SecureGlobalPayAdapter
```

Only providers present in the canonical payment-provider registry may be implemented. A provider is not production-routable merely because an adapter exists; activation requires the registered contract, business-model, jurisdiction, capability, webhook, reconciliation and human-approval gates.

## Core interface

Conceptual methods:

```text
createCheckout
createPayment
getPayment
createSubscription (only when native provider subscriptions are supported)
cancelSubscription (only when provider-side subscription exists)
refund
handleWebhook
verifyWebhook
reconcile
getProviderHealth
getCapabilities
```

Use provider capability flags rather than assuming every provider supports every operation. The SubscriptionService remains provider-independent and can select a merchant-managed renewal strategy when a provider only supports one-time payments.

## Routing

Payment routing considers:

- payment method
- currency
- country/region
- subscription vs one-time
- provider availability
- provider capability
- business rules
- processor health
- failure classification

Do not blindly retry a card decline across every processor.

Retry only provider-technical failures where appropriate and safe.

## Idempotency

Every incoming webhook must be stored with:

- provider
- provider event ID
- received timestamp
- signature verification result
- normalized event type
- processing state
- processing attempts

Duplicate events must be harmless.

## Ledger

Maintain a financial ledger independent from provider records.

Ledger examples:

- payment authorized
- payment captured
- payment failed
- refund
- chargeback
- subscription renewal
- creator earning
- platform fee
- AI cost
- manual adjustment

## Reconciliation

Scheduled Go Function:

```text
provider state
    vs
local payment state
    vs
ledger
```

Raise an admin alert when they diverge.

## Adult provider requirement

Before production activation, obtain current written approval from each processor for the exact business model, including:

- adult user-generated comics
- AI-assisted/generated content
- subscriptions
- downloads
- creator monetization if introduced

Do not assume that because a provider accepts “adult” businesses it automatically accepts every adult/AI business model.


## Subscription billing strategies

Provider adapters must report capabilities such as `oneTimePayments`, `nativeSubscriptions`, `recurringPayments`, refunds and webhooks.

StoryGalore supports three subscription billing strategies:

- `NATIVE_RECURRING` — provider manages recurring authorization.
- `MERCHANT_MANAGED` — StoryGalore creates a new renewal payment request per billing period and the user authorizes it.
- `MANUAL` — the user explicitly starts each renewal.

A provider that does not support native subscriptions must not be given a synthetic `createSubscription` implementation. The subscription engine owns the lifecycle and uses ordinary one-time payments for merchant-managed renewal.

Do not store wallet credentials or implement automatic crypto wallet debits to simulate recurring payments.

## Testing boundary

Payment/Stripe flows are tested end-to-end through the Appwrite gateway function (`api`), never through the standalone admin application.

- **Primary runtime**: the Appwrite `api` gateway function (on the Appwrite VPS), which owns the authoritative payment commands (`payment_create`, `payment_confirm_from_webhook`, `payment_refund`, `payment_reconcile`) and queries (`payment_get`, `payment_list`).
- **Stripe credentials** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are Appwrite function variables on the `api` function — they are not required by, and must not be assumed present in, `apps/admin`.
- **The admin app (`apps/admin`) is intranet-bound** (ADR-0018) and is excluded from the payment test path. Do not use its Fly.io deployments to exercise Stripe flows.

### End-to-end path

```text
payment_create (gateway)
  → local payments row (status CREATED) + Stripe PaymentIntent
  → status AWAITING_PROVIDER + providerPaymentId
Stripe confirm (test card 4242 4242 4242 4242)
  → payment_intent.succeeded
webhook → https://<domain>/webhooks/stripe (gateway)
  → signature verified, payment_events recorded
  → payments.status = CAPTURED
```

The deterministic contract is `contracts/deterministic/payments/testing.yaml`.

## NOWPayments integration

NOWPayments (crypto) is implemented in its own TypeScript/Node Appwrite function (`backend/appwrite/functions/nowpayments`), the sole TypeScript Appwrite function — allowed because the NOWPayments SDK has no Go equivalent (AGENTS.md rule 4 exception).

- **`create_payment`** (command) — `sdk.createDirectPayment()` creates a NOWPayments payment, writes a `payments` row (`provider: NOWPAYMENTS`, `status: AWAITING_PROVIDER`, `providerPaymentId` = NOWPayments `payment_id`), and returns the deposit address (`pay_address`) and crypto amount.
- **IPN** (`/webhooks/nowpayments`) — `sdk.parseWebhook()` verifies the HMAC-SHA512 `x-nowpayments-sig` signature and transitions the payment by `order_id`: `paid`→`CAPTURED`, `failed`→`FAILED`, `expired`→`EXPIRED`, `refunded`→`REFUNDED`, else `AWAITING_PROVIDER`.

Credentials are Appwrite function variables on the `nowpayments` function: `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_KEY`, `NOWPAYMENTS_IPN_CALLBACK_URL`. The public IPN domain is `nowpayments.story-galore.online`, locked by a Cloudflare WAF rule to `/webhooks/nowpayments` only.
