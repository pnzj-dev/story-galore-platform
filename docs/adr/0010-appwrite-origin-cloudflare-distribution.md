# ADR 0010 — Appwrite Origin, Cloudflare Distribution

## Decision

Appwrite Storage is the canonical media origin. Cloudflare provides distribution and edge controls. StoryGalore business authorization remains the source of truth for protected access.

## Rationale

This separates durable application storage from high-performance global delivery, keeps media ownership in the existing Appwrite architecture, and prevents CDN behavior from becoming an accidental authorization or data-store layer.

## Consequences

Uploads and canonical deletion are Appwrite operations. Durable media processing and cleanup may use Cloudflare Workflows. Cloudflare cache invalidation and delivery authorization are downstream concerns. Any future migration to an alternative origin requires a new ADR and compatibility/migration plan.
