# Appwrite Schema / Permission / Index Contract

The implementation MUST use current official Appwrite CLI/Console/templates for resource creation. This document defines semantics, not invented Appwrite resource IDs or deprecated CLI flags.

## Required contract dimensions
For every TableDB/DocumentDB collection, bucket, function and messaging resource, define:
- owner/tenant key
- classification
- read/write/delete actors
- server-only fields
- indexes supporting declared query patterns
- uniqueness/idempotency constraints
- retention/deletion behavior
- projection/event behavior

## Permissions
Client-readable data uses least-privilege Appwrite permissions. Sensitive mutations and privileged reads use server-side functions/services with explicit authorization.

## Storage
Original media is never exposed through unrestricted bucket access. Access is entitlement/policy checked and delivered through authorized/signed mechanisms.

## Index discipline
Every production query pattern MUST have an intentional index or documented bounded scan. Cursor pagination is required for unbounded collections.

## Resource IDs
IDs, generated manifests and environment-specific values MUST be produced by the official Appwrite tooling and committed/generated as appropriate; agents MUST NOT fabricate resource IDs.
