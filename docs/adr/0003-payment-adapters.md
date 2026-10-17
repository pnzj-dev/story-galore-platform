# ADR 0003 — Payment provider adapters

Status: Accepted

Payment providers are adapters behind a stable PaymentService.

The platform must be able to activate/deactivate providers without changing subscription/entitlement domain code. Provider adapters expose capabilities; subscription billing remains provider-independent.

Initial registered provider candidates:

- Stripe Connect
- NOWPayments
- Zen Payments
- SecureGlobalPay

Production activation is subject to provider approval for the exact business model.


A provider that lacks native recurring billing can still fund StoryGalore subscriptions through the `MERCHANT_MANAGED` strategy, using a new one-time renewal payment each period. The adapter must not fake provider-side subscriptions or automatic wallet debits.
