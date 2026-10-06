---
name: "Assign stable roles to shell regions"
description: "Use when establishing or extending an app shell: assign stable navigation, work, contextual-panel, scroll, and feedback responsibilities."
topics: ["application-design", "app-shell"]
tags: ["app-builder", "shell", "region-roles"]
---

# Assign stable roles to shell regions

Give each shell region a stable responsibility before implementing individual features. The shell establishes where people find locations, perform work, inspect context, and receive feedback. Its arrangement depends on the task; every application does not need a sidebar or inspector.

Record each region's owner, action scope, scroll boundary, resizing behavior, and narrow-window alternative. Build the shell with one realistic object and working interactions before filling it with multiple features.

A region responsibility is a durable contract, not a permanent rectangle. A contextual inspector can become a separate compact surface while keeping the same subject and editing responsibility. The choice of which surfaces exist belongs to the task model; the shell records how those chosen surfaces cooperate.

## Example

In a workflow editor, primary navigation changes the active workflow, the canvas edits that workflow, and the inspector edits the selection. Application settings belong to a separate destination. An inspector does not acquire a second independent copy of the selected node.

## Verify

Changing features preserves region responsibilities. Expanding a panel does not create accidental nested scrolling or obscure the primary task. Hidden or collapsed regions still have a discoverable entry point. The shell prototype demonstrates navigation, selection, and one action; decorative placeholder panels are insufficient.
