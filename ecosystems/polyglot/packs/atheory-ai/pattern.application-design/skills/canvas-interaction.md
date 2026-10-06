---
name: "Define canvas interaction modes"
description: "Use when gestures manipulate a tool canvas: define selection, pan, zoom, drag, coordinates, cancellation, and equivalent non-pointer operations."
topics: ["application-design", "canvas"]
tags: ["app-builder", "interaction", "canvas"]
---

# Define canvas interaction modes

A canvas defines how gestures map to selection, manipulation, panning, and zooming. Distinguish document coordinates from viewport coordinates and expose the current interaction mode when gestures could be ambiguous.

Specify hit testing, selection behavior, drag thresholds, snapping, zoom bounds, and cancellation. Keep viewport movement separate from document edits. Offer meaningful non-pointer access to the same objects and operations; a visual canvas cannot be the only way to understand the document.

## Example

Dragging a node moves it in document coordinates and creates one undoable edit. Panning changes the viewport without dirtying the document. Escape cancels an unfinished drag and restores its starting position. A structured object list supports selection and property editing without pointer manipulation.

## Verify

Interactions behave consistently at different zoom levels. Selecting a node and editing its properties share the same target. Gesture conflicts are resolved deliberately. Essential operations remain accessible through alternative controls, and cancellation does not leave a half-applied edit.
