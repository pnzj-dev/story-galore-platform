# ADR 0004 — Go for Appwrite Functions

Status: Accepted

Use Go Appwrite Functions for server-side application operations.

Reasons:

- requested platform standard
- strong performance and low runtime overhead
- Appwrite provides an official Go runtime/SDK
- clear separation between browser code and privileged operations

The agent must use `appwrite init functions` and select Go rather than inventing a custom deployment format.
