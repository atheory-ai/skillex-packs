---
name: "Design recovery before confirmation"
description: "Use when defining recovery for edits and consequential actions, including undo transactions, irreversible effects, and confirmation."
topics: ["application-design", "recovery"]
tags: ["app-builder", "interaction", "recovery"]
---

# Design recovery before confirmation

An action's recovery model is designed with the action. Prefer undo for frequent reversible edits when the product can reliably restore their effect. Use confirmation for consequential decisions that require deliberate consent, rather than interrupting every ordinary edit.

Specify transaction boundaries, undo scope, redo invalidation, and persistence effects. External side effects may require a compensating operation instead of true reversal. Never promise undo for an effect the application cannot restore.

## Example

Dragging a node creates one undoable move, not hundreds of pointer-update entries. Removing a local unsaved node can be reversible. Sending an external notification may be irreversible and needs a different consequence and recovery explanation.

## Verify

Undo identifies the affected document and action. A failed reversal communicates the actual outcome. Multi-object edits restore their agreed transaction boundary. Destructive actions preserve focus or move it to a meaningful surviving target. Confirmation text describes concrete consequences and available recovery.
