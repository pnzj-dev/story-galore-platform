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
