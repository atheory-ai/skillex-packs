---
name: "Keep location distinct from selection"
description: "Use when distinguishing destinations, active documents, tabs, and selected objects, including what navigation preserves."
topics: ["application-design", "navigation"]
tags: ["app-builder", "shell", "navigation"]
---

# Keep location distinct from selection

Navigation changes a meaningful location in the application. Selection identifies the object an action applies to within that location. A tab may represent a document, a view, or a destination; its meaning must be explicit.

Define which changes preserve drafts, selection, scroll, and history. Use consistent names for the same destination. Navigational controls communicate location; contextual controls communicate operations on the current object.

## Example

Opening workflow B changes the active document. Selecting node 4 within workflow B updates the inspector without adding a new primary destination. An inspector tab switches property groups while retaining node 4 as its subject.

## Verify

The current location and action target can be identified without guessing. A location change has defined restoration and unsaved-work behavior. Repeated controls do not introduce competing navigation hierarchies.

Platform conventions determine the presentation of navigation. [Microsoft's navigation guidance](https://learn.microsoft.com/en-us/windows/apps/design/basics/navigation-basics) discusses structure and context for Windows applications.
