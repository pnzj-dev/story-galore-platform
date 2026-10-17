# Privacy / GDPR V1 Contract

StoryGalore MUST implement privacy by design and data minimization. This contract describes V1 behavior and does not replace jurisdiction-specific legal review.

## Data classes
`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `SENSITIVE`, `SECRET`.
Secrets include provider keys and credentials. They are never returned to clients, agents, analytics, logs or workflow history.

## Purposes
Each sensitive/regulated data field MUST have a declared purpose, owner, retention period, access policy and deletion behavior.

## Rights workflows
V1 MUST support authenticated, auditable workflows for access/export, rectification where applicable, deletion, restriction/objection where applicable, and consent/preference management. Requests require identity verification proportional to risk.

## Minimization
Analytics and support projections MUST exclude passwords, API keys, payment credentials, session tokens, raw private messages and unnecessary prompt/PII content.

## Access
Least privilege applies to human staff and agents. Support/admin projections are purpose-limited. Break-glass access is temporary, scoped and audited.

## Consent
Consent records MUST include subject, purpose, version, status and timestamps. Withdrawal affects future processing where legally applicable; it does not retroactively alter immutable audit/financial evidence that must be retained.

## Processor/vendor controls
External AI, payment, analytics and infrastructure processors MUST be represented by explicit integration records and governed by the applicable contractual/security requirements.
