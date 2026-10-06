# Tests: undo-recovery.md

## Validation: Design recovery before confirmation

Prompt: Should every pointer update during a node drag be a separate undo item?
Success criteria:
  - Groups the completed drag into one editing transaction.
  - Defines document scope and redo behavior.
  - Distinguishes reversible edits from external irreversible side effects.
