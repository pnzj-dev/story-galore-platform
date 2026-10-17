# BYOAI Refinement Rules

BYOAI supports cloud and user-hosted execution. Execution location is orthogonal to adult policy.

Provider/model/workflow compatibility is capability- and policy-driven. User-hosted does not imply adult approval.

Before an external request, evaluate:

1. identity and tenant
2. entitlement
3. global dynamic configuration
4. provider/model/workflow capability
5. adult policy when applicable
6. region and legal restrictions
7. rate/cost guardrails
8. provider health

Persist policyDecisionId and policyVersion with the generation operation. Never persist plaintext provider secrets in workflow history, logs or analytics.
