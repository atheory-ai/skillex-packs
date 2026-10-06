# Tests: selection-inspectors.md

## Validation: Keep inspectors bound to explicit selection

Prompt: How should an inspector handle two selected objects with different timeout values?
Success criteria:
  - Shows a mixed value and identifies shared editable properties.
  - Captures explicit selected IDs for a batch edit.
  - Defines unfinished-draft and removed-subject behavior.
