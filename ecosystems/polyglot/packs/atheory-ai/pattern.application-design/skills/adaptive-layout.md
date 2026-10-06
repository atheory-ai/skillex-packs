---
name: "Adapt task surfaces to available space"
description: "Use when panels become compact, resized, sequential, or keyboard-obscured; preserve task context while changing surface arrangement."
topics: ["application-design", "adaptive-layout"]
tags: ["app-builder", "shell", "layout"]
---

# Adapt task surfaces to available space

Adapt region visibility and presentation to available space while preserving the task and its state. A narrow layout is a deliberate interaction arrangement, not a scaled-down desktop screenshot. Document which regions stay simultaneous and which become sequential.

Use available window space and input conditions rather than assuming device names determine layout. Keep essential actions reachable. A panel becoming a sheet or destination retains its subject, draft, and return path.

Adaptation changes how chosen surfaces are arranged; it does not justify choosing those surfaces in the first place. Prefer simultaneous context when the task requires comparison, and sequential presentation when it remains understandable with a clear return path. Preserve draft and selection ownership through either arrangement.

## Example

An expanded workflow editor shows canvas and inspector together. A compact layout opens the selected node's inspector as a separate surface with a clear return to the canvas. The editing subject does not change because the window resized.

## Verify

Test narrow and wide windows, text enlargement, visible software keyboards, and changed orientation where supported. Scroll ownership and focus remain understandable. [Android's adaptive layout guidance](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) provides examples of adapting surfaces to available space.
