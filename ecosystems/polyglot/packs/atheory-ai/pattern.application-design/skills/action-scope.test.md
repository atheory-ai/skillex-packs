# Tests: action-scope.md

## Validation: Make the action target explicit

Prompt: An inspector has focus. Should the main Run command operate on the inspected node?
Success criteria:
  - Allows intentionally focus-routed commands such as Copy while keeping document command targets stable.
  - Defines Run as document-scoped and Delete nodes as selection-scoped.
  - Uses explicit targets rather than component focus to infer the operation.
  - Keeps eligibility consistent across toolbar, menu, and shortcut.
