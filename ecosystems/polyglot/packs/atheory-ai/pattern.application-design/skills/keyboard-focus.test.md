# Tests: keyboard-focus.md

## Validation: Make focus transitions deliberate

Prompt: What should happen to keyboard focus after deleting the focused object or closing its settings dialog?
Success criteria:
  - Chooses a meaningful surviving target or returns to the opener.
  - Keeps visible focus distinct from selection.
  - Checks keyboard completion and avoids trapping or stealing editing keys.
