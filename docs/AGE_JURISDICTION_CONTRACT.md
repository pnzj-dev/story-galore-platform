# Age Assurance and Jurisdiction Contract

Age, entitlement, and adult-content display are separate decisions.

## Canonical states

- UNKNOWN
- UNDER_18
- AGE_VERIFIED_18_PLUS
- AGE_VERIFICATION_REQUIRED
- AGE_VERIFICATION_UNAVAILABLE

`adultContentEligible` MUST be derived server-side. Browser claims alone are insufficient where jurisdiction requires stronger assurance.

For `ADULT_18_PLUS`, display requires all of:

1. authenticated user
2. jurisdiction permits access
3. valid age eligibility
4. required paid entitlement
5. explicit adult-display preference enabled
6. global adult policy enabled
7. content/moderation/provider policy allows access

Unknown, stale, or unavailable sensitive policy state fails closed.
