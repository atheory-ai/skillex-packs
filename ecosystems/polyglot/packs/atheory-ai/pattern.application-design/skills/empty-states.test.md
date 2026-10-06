# Tests: empty-states.md

## Validation: Explain why a work surface has no content

Prompt: A disconnected run-history panel displays No runs yet and a Create workflow button. The same message appears when filters match nothing. What should change?
Success criteria:
  - Distinguishes first-use absence, no filter matches, and a failed data request.
  - Provides contextual recovery or filter adjustment rather than unrelated creation.
  - Allows a valid empty state without forcing an action and keeps starter data clearly identified.
