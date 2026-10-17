# Cost Control Domain

Expensive operations must use a reservation/settlement lifecycle.

Core concepts:
- CostReservation
- CostUsage
- CostSettlement
- Quota
- CreditBalance

Lifecycle:

1. authorize entitlement
2. reserve budget/credits
3. execute idempotently
4. record actual usage
5. settle actual cost
6. refund unused reservation

Reservations must survive retries and worker restarts without double-charging.
