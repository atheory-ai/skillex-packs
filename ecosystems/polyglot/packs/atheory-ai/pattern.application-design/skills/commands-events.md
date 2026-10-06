---
name: "Distinguish commands from events"
description: "Use when choosing explicit operation results versus event-driven reactions, including event payloads, emission timing, and subscription lifetime."
topics: ["application-design", "commands-events"]
tags: ["app-builder", "contracts", "events"]
---

# Distinguish commands from events

A command requests an operation and has an explicit result. An event reports a fact that has already occurred. Use events for independent reactions to committed changes; use calls and return values where a caller needs completion, rejection, or a value.

Define command ownership, target, eligibility, and failure outcomes. Define event payloads, emission point, subscription lifetime, and tracing identifiers. Events do not become a second mutable source of application state.

## Example

`exportWorkflow(id)` returns an operation handle or a typed rejection. After a successful export, its owner emits `workflowExported` with the workflow and operation IDs. Feedback and telemetry may react independently. The caller does not emit `exportRequested` and listen globally for a matching reply.

## Verify

A failed command does not publish a success fact. Subscriptions are removed with their owner. Tracing connects a command to its resulting events. Synchronous reads and edits remain explicit; event-driven coordination is chosen for a concrete dependency boundary, not applied universally.
