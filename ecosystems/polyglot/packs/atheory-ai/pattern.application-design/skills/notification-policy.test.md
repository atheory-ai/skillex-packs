# Tests: notification-policy.md

## Validation: Choose feedback from intent and context

Prompt: Should a form validation error and a completed background export both use the same disappearing toast?
Success criteria:
  - Keeps field errors attached to their fields.
  - Retains actionable export outcomes in an appropriate persistent surface.
  - Chooses urgency, interruption, and announcement behavior from context.
