# Tests: web-location.md

## Validation: Preserve web location and native semantics

Prompt: Should every selection and modal opening create a browser-history entry?
Success criteria:
  - Uses URL/history for meaningful revisitable locations.
  - Keeps ephemeral interaction state out unless explicitly useful to deep-link.
  - Tests direct entry, refresh, Back/Forward, and link/button semantics.
