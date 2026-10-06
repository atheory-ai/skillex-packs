# Tests: async-operations.md

## Validation: Make operation state explicit

Prompt: A workflow run finishes after its document changed. How should the result be presented?
Success criteria:
  - Labels the result with its target document and version.
  - Prevents stale results replacing current state.
  - Defines retry, duplicate submission, and cancellation semantics.
