# Tests: draft-saving.md

## Validation: Define the editing transaction

Prompt: An autosave response arrives after the user has edited the same field again. May the UI label the current draft saved?
Success criteria:
  - Associates acknowledgement with the version actually saved.
  - Keeps the newer draft pending or dirty.
  - Defines retry, conflict, cancellation, and navigation behavior.
