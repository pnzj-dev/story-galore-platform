# Incident Response Contract

## Severity
- **SEV1:** active compromise, material payment/security/privacy incident, or broad production outage.
- **SEV2:** major degradation or significant scoped security/financial impact.
- **SEV3:** limited customer impact or operational defect with workaround.
- **SEV4:** non-urgent defect/maintenance.

## Procedure
Detect -> triage -> contain -> preserve evidence -> eradicate/fix -> recover -> validate -> communicate -> postmortem.

Security/payment/privacy incidents require restricted access, immutable evidence, correlation IDs, incident owner and explicit recovery validation. Do not expose secrets while debugging. Postmortems record timeline, impact, root/contributing causes, corrective actions and verification evidence.
