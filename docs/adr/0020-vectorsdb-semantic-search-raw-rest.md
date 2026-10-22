# ADR 0020 — VectorsDB semantic search via raw REST

## Status

Accepted.

## Context

StoryGalore's recommendation rail (`recommendations_get`) currently uses
functional related-content (same publication type) over TablesDB. Semantic
recommendations — surfacing content by meaning (themes, premise, style) rather
than by type — require Appwrite's VectorsDB engine (vector embeddings + HNSW
similarity search, e.g. `nearText`).

The Appwrite Go SDK (`github.com/appwrite/sdk-for-go` v1.0.0, the latest
release) and the web SDK do not expose the VectorsDB vector-search methods
(`textEmbedding` / `nearText`). The Appwrite MCP exposes a `vectors_db` service
(list collections/documents) but not a similarity-search operation. So there is
no SDK or MCP call today that can run a semantic query.

## Decision

StoryGalore calls VectorsDB over its **raw REST API** (HTTP) from the `api`
gateway function, using the function's narrowly scoped Appwrite key. Domain code
keeps depending on a `RecommendationService` port, so the transport (REST now,
SDK later) is an adapter detail.

Semantic recommendations remain a **feature-flagged, deferred enhancement** —
the functional related-content rail stays the V1 default. This ADR only
authorizes the transport approach, not a change to V1 recommendation behavior.

## Rationale

- The SDK and MCP are the gap, not the platform: VectorsDB itself is available
  in the project (Appwrite provides it as one of its five database engines).
- Raw REST unblocks semantic search without waiting for an SDK release, and it
  stays behind the existing gateway authorization (per-operation allowlist +
  capability checks).
- It is reversible: when an Appwrite SDK ships the VectorsDB methods, the REST
  adapter can be replaced with the SDK without touching domain code.

## Consequences

- The `api` gateway gains a thin VectorsDB REST adapter (exact endpoints verified
  against the Appwrite REST reference at implementation time).
- No new storage mechanism is introduced at the V1 decision layer; VectorsDB is
  used deliberately alongside TablesDB/DocumentsDB per the platform's
  storage-split ADR.
- The recommendation contract must document that semantic ranking is
  best-effort and is never used to bypass entitlement, age, jurisdiction,
  moderation, or language filtering.
- A follow-up ADR (or this one amended) switches the adapter to the SDK once a
  release exposes VectorsDB vector search.
