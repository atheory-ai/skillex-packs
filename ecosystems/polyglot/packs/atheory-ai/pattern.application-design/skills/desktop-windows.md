---
name: "Scope desktop work to windows and documents"
description: "Use for desktop apps with windows and documents: scope state and command targeting across windows, closure, menus, and shortcuts."
topics: ["application-design", "desktop-platform"]
tags: ["app-builder", "platform-desktop"]
---

# Scope desktop work to windows and documents

Desktop shells define how windows relate to documents and how commands find their target. Follow the target operating system's conventions for menus, shortcuts, window controls, and document lifetime. A desktop application is not specified by giving a web layout a larger viewport.

Record application-wide, window-wide, and document-wide state. Define behavior for multiple windows, switching active documents, closing a dirty window, and reopening work. Persist layout preferences separately from document content.

## Example

Two workflow windows share application preferences but retain separate selection and draft state. A Save command resolves the active document explicitly. Closing one window does not cancel an unrelated operation owned by another window.

## Verify

Resizing, window switching, standard shortcuts, and unsaved-work closure behave predictably. Menu and toolbar commands use the same targets and eligibility. [Microsoft's Windows navigation guidance](https://learn.microsoft.com/en-us/windows/apps/design/basics/navigation-basics) is one platform reference; native conventions must be checked for each chosen operating system.
