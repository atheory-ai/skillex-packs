---
name: "Preserve web location and native semantics"
description: "Use for web apps that need meaningful URLs, browser Back and Forward, refresh, direct entry, and native control semantics."
topics: ["application-design", "web-platform"]
tags: ["app-builder", "platform-web"]
---

# Preserve web location and native semantics

Web applications preserve browser expectations for meaningful location, history, refresh, and controls. A location that people need to revisit or share has a defined URL representation. Ephemeral hover and drag state generally does not belong in browser history.

Use links for navigation and buttons for operations. Define direct-entry loading, unavailable records, authorization failure, and unsaved-work transitions. Browser Back must have a coherent relationship with application navigation.

## Example

A workflow URL opens that workflow directly after refresh. Selecting a node may use URL state when deep-linking that node is useful; otherwise it stays local to the document session. A toolbar operation does not create a new history entry simply because a modal opened.

## Verify

Direct entry, refresh, Back, Forward, and link opening have deliberate outcomes. Native control semantics and accessible names survive visual styling. Browser behavior is tested separately from native desktop and mobile navigation assumptions.
