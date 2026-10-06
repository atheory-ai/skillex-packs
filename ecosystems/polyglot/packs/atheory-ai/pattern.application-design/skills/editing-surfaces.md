---
name: "Choose an editing surface by context and interruption"
description: "Use when choosing inline editing, an inspector, a modal dialog, or a separate destination for a form; weigh context, frequency, complexity, and commitment."
topics: ["application-design", "editing-surfaces"]
tags: ["app-builder", "ui-design", "layout", "forms"]
---

# Choose an editing surface by context and interruption

Choose an editing surface according to the context needed, the amount of work, and the interruption it causes. The same form can have different appropriate presentations on different platforms or window sizes. Component availability alone does not decide where editing belongs.

Inline editing fits a small, local change when its subject and completion behavior remain clear. An inspector fits repeated edits to a selected subject while the main work stays visible. A separate destination fits substantial work that needs room, its own navigation, or a revisitable location. A modal dialog fits a bounded interaction that intentionally blocks the underlying task until resolved; repeated routine work rarely benefits from that interruption.

These are conditions to weigh, not field-count thresholds. Keep the subject visible or named, define how entry and exit work, and provide enough space for validation and instructions. Presentation does not determine the save policy: a panel can have Apply and a dialog can persist changes immediately if that behavior is explicit.

## Example

Renaming a node may work inline. Repeatedly tuning connected nodes benefits from a contextual inspector. A complex schedule editor may deserve a destination with a preview. Resolving an overwrite decision may require a bounded blocking dialog. Compact layouts can present an inspector sequentially while retaining its subject and draft.

## Verify

Editing preserves the context necessary for the task and avoids repeated unnecessary interruption. Long content, errors, and keyboard-visible layouts remain usable. Entry, cancellation, commitment, and return focus have defined outcomes. [Microsoft's dialog guidance](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/dialogs-and-flyouts/) discusses intentional interruption; detailed draft and focus policies remain separate decisions.
