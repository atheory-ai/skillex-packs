---
name: "Make focus transitions deliberate"
description: "Use when focus moves through controls, dialogs, deletion, or panel transitions; define keyboard access and restoration independently of selection."
topics: ["application-design", "accessibility"]
tags: ["app-builder", "interaction", "focus"]
---

# Make focus transitions deliberate

Keyboard focus remains visible and moves predictably through meaningful controls. Focus and selection have different responsibilities. A view transition, removed object, or dismissed dialog has an explicit next focus target.

Use platform controls and established widget keyboard behavior. On the web, custom composite widgets require their own keyboard implementation; ARIA semantics alone do not provide it. Do not capture text-editing keys for global commands while a field is being edited.

## Example

Closing a node-settings dialog returns focus to its opener when that control still exists. Deleting the focused node moves focus to an appropriate surviving control. Selection can remain visible in the canvas while keyboard focus is in the inspector.

## Verify

The representative task can be completed using a keyboard. Focus cannot become trapped or disappear behind a panel. Shortcut behavior is discoverable and avoids platform conflicts. [W3C's keyboard interface guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) provides web widget conventions and focus-management reasoning.
