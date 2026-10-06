---
name: "Evaluate complete task paths"
description: "Use when assessing a generated app or later feature addition through rendered success, error, interrupted, and keyboard task walkthroughs."
topics: ["application-design", "experience-review"]
tags: ["app-builder", "evaluation", "task-walkthrough"]
---

# Evaluate complete task paths

Evaluate an application through complete user tasks and rendered interactions. Code structure and a polished screenshot are insufficient evidence of a coherent experience. Record observations against explicit task outcomes and interaction rules.

Start with one representative workflow, then add another feature without changing the established shell responsibilities. Review success, rejection, interruption, empty state, and recovery. Separate structural checks from user testing; passing a checklist does not prove real usability.

Structural checks establish that intended states and contracts exist. A walkthrough establishes what happened in a tested task. Observations from intended users establish whether their understanding and needs match the design. These forms of evidence answer different questions and should be reported separately.

## Example

Configure a workflow node, enter an invalid timeout, correct it, run the workflow, navigate away during execution, and return to inspect its result. Repeat with keyboard input and a compact window. Then add a second node type and inspect whether its editor preserves existing patterns.

## Verify

The review records where the task failed or became ambiguous, not only whether a control rendered. A before/after pack experiment uses the same brief, resources, and evaluation criteria. Architectural opinions are revised when observed task behavior contradicts their intended benefit.
