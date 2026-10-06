---
name: "Give each state value one owner"
description: "Use when domain data, drafts, selection, location, and view state overlap; define each owner, lifetime, and reconciliation boundary."
topics: ["application-design", "state-ownership"]
tags: ["app-builder", "state", "ownership"]
---

# Give each state value one owner

Each state value has one authoritative owner and a defined lifetime. Distinguish persisted domain data, editable drafts, location, selection, and temporary view state. Derived views read that state rather than maintaining competing synchronized copies.

Record which transitions reset, preserve, or persist each value. Keep state local when only one view needs it. Shared ownership is justified by actual consumers, not by the existence of a global store.

## Example

The workflow owns committed node settings. An editing session owns a timeout draft. A selection model owns selected node IDs. The inspector derives its subject from that selection; the canvas does not keep another inspector subject in parallel.

## Verify

A late server response cannot overwrite a newer draft without a defined reconciliation rule. Switching documents cannot expose the previous document's selection. Reload and reopening restore only state deliberately persisted. The ownership record explains who can change each value and when it becomes invalid.
