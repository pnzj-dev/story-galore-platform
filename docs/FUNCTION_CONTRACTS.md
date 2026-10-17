# Function Contracts

The exact request/response schemas should be implemented as versioned JSON contracts.

## authorization

Input:
- user identity/session
- resource type/id
- requested action

Output:
- allowed
- reason
- entitlement snapshot

## uploads

Input:
- authenticated user
- project/entity
- filename
- MIME type
- expected size
- checksum if available

Output:
- upload instructions/reference
- file ID
- expiry/constraints

## ai-comic-generation

Input:
- project
- prompt configuration
- references
- requested generation type

Output:
- job ID
- reserved credits

## ai-usage

Input:
- job ID
- estimated usage

Output:
- reservation state

## payments

Input:
- provider-independent checkout command

Output:
- checkout/session/invoice data
- provider ID
- capabilities

## payment-webhooks

Input:
- provider-specific HTTP request

Output:
- normalized event status

Requirements:
- verify signature
- store event idempotently
- never trust client-originated payment state

## payment-reconciliation

Scheduled input:
- provider and time window

Output:
- reconciliation summary
- anomalies

## subscriptions

Input:
- authenticated actor
- plan/subscription command
- idempotency key

Output:
- subscription snapshot
- lifecycle status
- policy decision reference

Requirements:
- provider-independent
- server-authoritative
- state-machine validated
- never grant entitlement directly from a client redirect

## subscription-reconciliation

Input:
- provider
- subscription scope/time window

Output:
- reconciliation summary
- subscription anomalies
- repair operation IDs where applicable

## notifications

Input:
- user/topic
- template
- variables
- optional schedule

Output:
- Appwrite Messaging message ID


## Media functions

### `media-processing`
Input: authorized media asset ID + operation.
Output: processing status, derived asset references, metadata.
Rules: idempotent processing, owner/entitlement checks, audit significant state changes.

### `video-playback`
Input: publication/media asset ID + viewer context.
Output: entitlement-checked playback instructions or denial.
Rules: never return protected storage paths without authorization.

### `media-manifest`
Input: publication ID + viewer context.
Output: client-safe ordered media manifest.
Rules: filter inaccessible assets server-side.

### `media-analytics`
Input: normalized playback/progress event.
Output: accepted event ID.
Rules: validate timestamps, deduplicate event IDs, avoid unnecessary personal data.
