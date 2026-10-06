# Tests: state-ownership.md

## Validation: Give each state value one owner

Prompt: The canvas and inspector each store their own selected node object. How should this be redesigned?
Success criteria:
  - Uses a single selection owner with stable IDs.
  - Derives both views from canonical data.
  - Separates editable drafts and defines reset/lifetime behavior.
