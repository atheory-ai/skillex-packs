---
name: "Model the user task"
description: "Use when a brief names features or panels but leaves user goals, work objects, successful completion, and recovery undefined."
topics: ["application-design", "task-model"]
tags: ["app-builder", "planning", "product-model"]
---

# Model the user task

Describe an application in terms of the work a person completes: the object being changed, the intended outcome, and the evidence of success. A feature list alone leaves the interaction between screens undefined.

For each representative task, record its starting context, steps, interruptions, and completion condition. Include an unsuccessful path. Keep product vocabulary stable across navigation, commands, fields, and feedback.

## Example

“Configure and run a workflow” involves a workflow document, selected nodes, editable node settings, a run operation, and an inspectable result. Its screens follow those relationships. A list of “sidebar, canvas, inspector, and Run button” does not explain them.

## Verify

A task walkthrough can explain what the person changes, how they know it worked, and what they do after failure. Every major surface contributes to at least one named task. Unknown product requirements are recorded as assumptions, not silently invented.
