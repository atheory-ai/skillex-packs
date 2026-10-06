---
name: "Express needs through application capabilities"
description: "Use when features need notify, navigate, select, or other shared application capabilities without coupling intent to UI components."
topics: ["application-design", "capabilities"]
tags: ["app-builder", "contracts", "capabilities"]
---

# Express needs through application capabilities

Features express application needs through explicit capability contracts. A contract carries intent, context, and observable outcomes; the shell supplies presentation and interaction policy. This pack prefers injected or explicitly provided capabilities over global component calls.

Keep the vocabulary small and task-specific. Define inputs, outputs, failure behavior, ownership, and lifetime. Validation rules and business decisions remain with their authoritative owner; a capability does not erase them.

## Example

An export feature requests `notify({kind: "operation-completed", operationId, message, action})`. It does not request “show a green toast.” The feedback policy can present the result inline, in operation history, or through a notification surface appropriate to the context.

## Verify

Replacing a presenter leaves feature intent unchanged. Contracts preserve information required for accessible, actionable feedback. A test can observe the requested capability without rendering a UI component. New capabilities represent recurring application responsibilities, not one wrapper for every widget.
