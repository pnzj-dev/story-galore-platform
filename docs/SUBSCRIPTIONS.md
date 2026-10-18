# Subscription & Plans Architecture

Subscriptions are a first-class commerce domain. They are not a field on `Payment` and must not be inferred directly from payment records.

## Domain separation

```text
Plan
  ↓
Subscription
  ↓
Payment / PaymentAttempt / PaymentEvent
  ↓
Entitlement
  ↓
Policy Engine
  ↓
Access decision
```

The authoritative relationship is:

- `Payment` records money movement and provider interactions.
- `Subscription` records the customer's recurring commercial agreement and lifecycle.
- `Plan` defines the product/pricing configuration offered by StoryGalore.
- `Entitlement` records the access right actually granted to the user/tenant.

The invariant is:

```text
paymentSucceeded != subscriptionActive != entitlementGranted
```

A successful payment never directly grants access. Provider webhooks, reconciliation and domain validation are authoritative.

## Plans

A plan is a versioned commercial product definition. At minimum it defines:

- `id`
- `code`
- `name`
- `description`
- `status` (`DRAFT | ACTIVE | RETIRED`)
- `scope` (`PLATFORM | CREATOR | WORKSPACE`)
- `currency`
- `amount`
- `billingInterval` (`DAY | WEEK | MONTH | YEAR`)
- `billingIntervalCount`
- `trialDays`
- `entitlementClassIds[]`
- `features[]`
- `adultEligible` (never sufficient by itself for adult access)
- `adFree`
- `effectiveAt`
- `retiredAt`
- `version`
- timestamps

Changing price or entitlement semantics creates a new plan version or an explicitly versioned price record. Historical subscriptions must remain auditable against the terms they accepted.

## Subscriptions table

The canonical `subscriptions` record should contain at least:

- `id`
- `userId`
- `creatorId` nullable
- `workspaceId` nullable
- `planId`
- `planVersion`
- `provider`
- `providerCustomerId` nullable
- `providerSubscriptionId` nullable
- `status`
- `billingMode`
- `currency`
- `amount`
- `billingInterval`
- `billingIntervalCount`
- `trialStartedAt` nullable
- `trialEndsAt` nullable
- `currentPeriodStart`
- `currentPeriodEnd`
- `cancelAtPeriodEnd`
- `cancelledAt` nullable
- `cancellationReason` nullable
- `endedAt` nullable
- `lastPaymentId` nullable
- `nextPaymentAt` nullable
- `gracePeriodEndsAt` nullable
- `policyDecisionId` nullable
- `version`
- `createdAt`
- `updatedAt`

Provider-specific identifiers stay on commerce records and never become domain authorization identifiers.

## Subscription lifecycle

```text
CREATED
  ↓
CHECKOUT_STARTED
  ↓
AWAITING_PROVIDER
  ↓
ACTIVE
  ├──→ PAST_DUE
  │      ├──→ ACTIVE
  │      ├──→ GRACE_PERIOD
  │      └──→ CANCELLED
  ├──→ CANCEL_AT_PERIOD_END
  │      └──→ EXPIRED
  ├──→ PAUSED
  │      └──→ ACTIVE
  └──→ EXPIRED

Any valid active-state path may also terminate as CANCELLED when the provider/domain contract requires immediate cancellation.
```

Exact transition legality is defined in `contracts/state-machines/subscription.yaml`.

## Required behaviors

V1 must support:

- checkout/start
- activation from authoritative provider events
- recurring renewal
- failed renewal
- grace period where provider/business policy supports it
- cancellation immediately or at period end
- expiration
- plan change
- upgrade/downgrade
- proration where supported and explicitly modeled
- trial start/end
- provider resynchronization
- reconciliation
- entitlement synchronization
- duplicate webhook idempotency
- audit history
- customer-visible subscription status
- admin repair with explicit authorization and audit

Provider capabilities must be detected rather than assumed.

## Subscription events

Persist normalized lifecycle events independently from the current subscription snapshot. Examples:

- `subscription.created`
- `subscription.checkout_started`
- `subscription.activated`
- `subscription.renewal_succeeded`
- `subscription.renewal_failed`
- `subscription.grace_period_started`
- `subscription.cancel_requested`
- `subscription.cancelled`
- `subscription.expired`
- `subscription.paused`
- `subscription.resumed`
- `subscription.plan_changed`
- `subscription.reconciled`
- `subscription.repair_requested`

Events must carry correlation and idempotency metadata and must never contain payment credentials or provider secrets.

## Entitlement synchronization

Subscription state is an input to entitlement calculation, not the entitlement itself.

```text
subscription event
      ↓
subscription state transition
      ↓
outbox event
      ↓
entitlement projection/service
      ↓
policy evaluation
```

Entitlement creation, update and revocation must be idempotent and auditable.

Adult entitlements additionally require the complete adult-content policy chain: authentication, age eligibility, paid entitlement, explicit adult preference, global policy, jurisdiction, moderation and provider/model policy where applicable.

## Cloudflare Workflows

Cloudflare Workflows is used only for durable subscription work such as:

- reconciliation
- provider resynchronization
- entitlement repair
- long-running migration/backfill
- recovery after provider outages

Normal subscription reads and ordinary CRUD must not require Cloudflare Workflows.

## Financial rules

- Never use floating point for money.
- Preserve currency and minor-unit precision.
- Record provider fees, taxes and refunds separately where applicable.
- Renewal is a new payment event/attempt even when it belongs to the same subscription.
- Refunds and chargebacks may require entitlement compensation according to policy.
- Reconciliation must compare provider state, payment records, subscription state and ledger state.
- All externally visible mutations require durable idempotency keys.

## Provider-independent billing

The subscription domain is independent from provider-side recurring billing. A payment provider advertises capabilities and StoryGalore selects a billing strategy.

```text
SubscriptionService
      ↓
BillingStrategy
  ┌───┼───────────────┐
  ↓   ↓               ↓
Native  Merchant-     Manual
        managed
  ↓       ↓             ↓
Provider  Renewal      User
recurring payment      initiated
```

### Strategies

- `NATIVE_RECURRING`: the provider supports and manages recurring authorization.
- `MERCHANT_MANAGED`: StoryGalore creates a new renewal payment request for every period. The user must authorize/pay it. This is the recommended strategy for one-time-only crypto processors.
- `MANUAL`: the user explicitly starts each renewal.

V1 native providers: **Stripe** (Stripe Billing — auto-charges a saved payment method) and **NOWPayments** (Recurring Payments API — plan + email subscription or custodial balance deduction; a plan must be created first). Any provider without native support routes to `MERCHANT_MANAGED`.

A merchant-managed subscription is still a real StoryGalore subscription. The difference is how its next period is funded.

Never emulate automatic wallet debits or store wallet credentials to manufacture recurring charges. Never claim that a provider supports native subscriptions when its capability contract says otherwise.

Every renewal is a new payment attempt linked to the same subscription. Duplicate provider events must be idempotent.

The UI should expose whether renewal is automatic or requires user action. The SubscriptionService interface remains the same for all strategies.
