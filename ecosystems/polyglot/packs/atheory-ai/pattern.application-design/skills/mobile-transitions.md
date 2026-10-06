---
name: "Preserve context through mobile transitions"
description: "Use for mobile flows with touch, back navigation, software keyboards, system insets, interruption, and changing available space."
topics: ["application-design", "mobile-platform"]
tags: ["app-builder", "platform-mobile"]
---

# Preserve context through mobile transitions

Mobile task flows define transitions between contextual surfaces, their return path, and preservation of unfinished work. Follow the chosen platform's back and gesture conventions. Touch interaction needs visible alternatives for actions otherwise discoverable only through hover or keyboard shortcuts.

Plan for software keyboards, system insets, interruptions, and changing available space. Mobile includes expanded and resizable layouts; it is not synonymous with a narrow phone. Application state must have a deliberate restoration policy when execution is interrupted.

## Example

A node inspector occupies a compact editing surface. Showing the software keyboard keeps the edited field and completion action reachable. Returning to the canvas restores its selected node and viewport. An expanded layout may show both surfaces concurrently.

## Verify

Back navigation has a defined relationship with drafts and nested surfaces. Common tasks are usable with touch. Important state survives supported interruptions, and actions remain reachable around system UI. [Android's adaptive layout guidance](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout) supplies one platform reference; other mobile platforms need their own convention checks.
