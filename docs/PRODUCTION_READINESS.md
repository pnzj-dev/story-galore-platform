# StoryGalore V17.1 — Production Readiness Contract

This document freezes production-readiness rules without changing the V16.3 repository layout or product scope.

## Scope

V17.1 is additive. Existing V16.3 paths remain authoritative. No existing file is moved or renamed by this contract.

## Required gates

1. Privacy/security hardening
2. Age assurance and jurisdiction policy
3. Financial invariants and reconciliation
4. AI provenance and IP traceability
5. Authorization after search/recommendation retrieval
6. Expand/migrate/contract deployment discipline
7. Backup restore drills and recovery validation
8. Cross-agent contract compatibility

## Release rule

A release is blocked when any mandatory gate fails. Documentation alone does not constitute PASS; executable validators and CI evidence are required.
