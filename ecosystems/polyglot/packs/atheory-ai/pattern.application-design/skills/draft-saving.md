---
name: "Define the editing transaction"
description: "Use when defining Apply, Save, autosave, cancellation, document switching, and conflict behavior for an editing transaction."
topics: ["application-design", "drafts"]
tags: ["app-builder", "forms", "drafts"]
---

# Define the editing transaction

An editing flow defines when changes become committed and what happens before then. Choose explicit save or autosave per task, and communicate pending, saved, rejected, and conflicting states. A dirty indicator follows the editing transaction rather than any component rerender.

Define cancellation, document switching, window closing, and reload behavior. Preserve recoverable drafts when interruption is expected. Autosave needs a retry and conflict policy; it does not eliminate data-loss decisions.

## Example

An inspector can buffer related node settings until Apply. Another application may autosave each accepted edit. Both policies define whether selecting a new node retains, applies, or discards the current draft, and how a failed save remains visible.

## Verify

An acknowledged save refers to the version actually saved, not a newer draft still in flight. Navigation cannot silently discard work. Cancel has an explicit effect on persisted data. Concurrent changes produce a deliberate merge or resolution path rather than last-response-wins overwriting.
