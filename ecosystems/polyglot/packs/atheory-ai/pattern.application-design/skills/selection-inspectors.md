---
name: "Keep inspectors bound to explicit selection"
description: "Use when an inspector follows selection: define no selection, multiple subjects, mixed values, and stale-target editing behavior."
topics: ["application-design", "selection"]
tags: ["app-builder", "interaction", "selection"]
---

# Keep inspectors bound to explicit selection

An inspector displays and edits an explicit selection subject. Define no-selection, single-selection, and multi-selection behavior before adding fields. Keyboard focus and selection are separate states; moving focus to an inspector must not silently change its subject.

For multiple objects, identify shared editable properties and communicate mixed values. Batch edits have an explicit target set. When the subject changes or disappears, resolve its draft and focus through defined transitions.

## Example

Two selected workflow nodes with different timeouts show a mixed timeout value. Entering a value updates the captured selected IDs according to the batch-edit policy. A delayed edit must not accidentally apply to a newly selected third node.

## Verify

Deleting the subject clears or replaces selection intentionally. A blank inspector explains its state. Switching selection handles an unfinished draft consistently. Focus styling remains distinct from selection styling; [W3C's keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) explains that distinction.
