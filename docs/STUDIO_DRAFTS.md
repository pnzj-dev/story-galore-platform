# Studio Drafts and Recovery Contract

Studio drafts use the platform-wide draft/revision contract. The editor MUST operate against a server revision and retain client mutation IDs.

Autosave: debounce 2–5 seconds after changes settle and save before major transitions such as navigation, publish or close when possible.

Recovery: IndexedDB retains unsynced operations and last known document state. Reconnect replays operations idempotently. A server conflict exposes the current server revision and the local base revision; the user resolves rather than silently overwriting.

A `Saved` state is authoritative only after the server acknowledges the revision. Browser crashes, refreshes and temporary network failures MUST preserve recoverable local work.
