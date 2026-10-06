---
name: "Make operation state explicit"
description: "Use when an operation can complete later: define identity, version, progress, failure, retry, cancellation, and stale results."
topics: ["application-design", "async-operations"]
tags: ["app-builder", "state", "operations"]
---

# Make operation state explicit

An asynchronous operation has a stable identity and observable state. Represent pending, meaningful progress, success, failure, and cancellation when supported. Define retry and duplicate-submission behavior. A spinner alone does not explain what is happening or what remains possible.

Keep unrelated work available when safe. Record which object and version an operation targets. Cancellation is only offered when its actual effect can be explained; closing a panel need not cancel the underlying operation.

## Example

A workflow run targets workflow A at version 7. While the user edits version 8, its result is labeled as the version-7 result. Retrying a failed run does not reuse an ambiguous completion message from the original operation.

## Verify

Late results cannot replace a different object's state. Failure preserves enough context to retry or inspect the problem. Duplicate requests are either prevented or deliberately supported. Progress claims reflect known progress; indeterminate work remains indeterminate. Operation history and notification policy use the same operation ID.
