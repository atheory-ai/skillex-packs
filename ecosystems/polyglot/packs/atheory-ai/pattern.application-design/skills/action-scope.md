---
name: "Make the action target explicit"
description: "Use when the target of toolbar, menu, shortcut, or contextual actions is ambiguous; define application, document, selection, and field scope."
topics: ["application-design", "action-scope"]
tags: ["app-builder", "shell", "commands"]
---

# Make the action target explicit

Every action has an explicit target: application, workspace, document, selection, or field. Its placement, label, availability, and keyboard behavior communicate that target. A command cannot infer its subject from whichever component happens to be mounted.

Keep the same action's identity and eligibility rules consistent across a toolbar, menu, shortcut, and contextual control. Scope is a product decision, not a reason to duplicate the operation's implementation.

Focus may deliberately select a command target, as in a text editor where Copy uses the focused selection. That routing policy must be defined rather than inferred accidentally from component mounting. Document actions keep their target when focus moves to a field.

## Example

“Run workflow” targets the active document. “Delete nodes” targets the selected node IDs. “Reset timeout” targets one field in the inspector. Running the workflow must not change meaning when the inspector receives focus.

## Verify

The action target is visible or otherwise communicated before execution. Empty and multiple selections have defined behavior. Unavailable actions expose a useful reason when that reason helps the user proceed; destructive controls remain distinct from frequent routine actions.
