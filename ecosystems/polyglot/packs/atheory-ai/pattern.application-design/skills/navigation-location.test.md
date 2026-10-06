# Tests: navigation-location.md

## Validation: Keep location distinct from selection

Prompt: Should selecting a canvas node create a new navigation destination?
Success criteria:
  - Separates active document/location from selected object.
  - Updates the contextual inspector without inventing primary navigation.
  - Defines preservation of drafts, scroll, selection, and history.
