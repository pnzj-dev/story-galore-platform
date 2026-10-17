# ADR 0011 — Creator Studio and Comic Editor Architecture

## Decision
Creator Studio is a domain/application layer over existing StoryGalore contracts. The comic editor uses explicit document/page/panel/layer records and versioned editor operations. UI components never access Appwrite directly.

## Reasons
This keeps authorization, entitlement, adult policy, drafts, media delivery, AI provenance and publication validation centralized and allows multiple coding agents to implement Studio without inventing persistence or security behavior.

## Consequences
The editor has more explicit contracts and revision bookkeeping, but gains deterministic saves, recovery, testing, cross-client compatibility and safe AI application.
