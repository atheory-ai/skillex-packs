# Tests: canvas-interaction.md

## Validation: Define canvas interaction modes

Prompt: Should panning dirty the document, and how can an unfinished node drag be cancelled?
Success criteria:
  - Separates viewport state from document edits.
  - Restores the starting position on drag cancellation.
  - Defines coordinates, gesture modes, transaction boundaries, and alternative controls.
