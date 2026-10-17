# Moderation

## Pipeline

```text
upload / AI generation
        ↓
processing
        ↓
automated classification
        ↓
moderation decision
        ↓
human review when required
        ↓
publication
```

## Independent dimensions

Do not collapse all policy into `adult`.

Track:

- content rating
- sexual content classification
- violence/gore
- language
- audience
- AI origin
- moderation status
- jurisdiction restrictions if applicable

## States

```text
DRAFT
PROCESSING
PENDING_REVIEW
APPROVED
PUBLISHED
HIDDEN
REJECTED
REMOVED
```

## Reports

Users can report:

- comic
- episode
- page
- comment
- creator profile

Reports create moderation cases.

## Evidence

Store moderation evidence in a private Storage bucket and reference it from the moderation case.

Limit access to authorized staff.

## Appeals

Moderation actions should support an appeal state and preserve the original decision/audit trail.
