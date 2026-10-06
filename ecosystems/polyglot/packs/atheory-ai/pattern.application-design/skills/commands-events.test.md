# Tests: commands-events.md

## Validation: Distinguish commands from events

Prompt: Should saving emit saveRequested and wait for a global saveFinished event to learn whether it worked?
Success criteria:
  - Uses an explicit command result for completion or rejection.
  - Emits a committed fact only after success for independent reactions.
  - Defines ownership, subscription cleanup, and tracing.
