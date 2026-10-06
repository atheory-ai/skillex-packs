# Evaluation brief: workflow editor

## Fixed task

Build an application that lets a person create a workflow, add and select nodes, edit node settings, save the document, run it, and inspect the result. A run can fail. Configuration must remain available after failure. Use deterministic mock operations initially so success, failure, and delayed completion are reproducible.

Produce a short task/state model, a working shell, and one complete node-edit/run workflow. Include an appropriate working surface, object navigation, a contextual editing surface with forms, and outcome feedback. Record why spatial, comparison, and editing tasks use their chosen surfaces and which information must remain visible together. Let the application justify where these surfaces belong rather than prescribing a decorative three-column screenshot.

Use realistic content: long node names, several editable fields, mixed node types, and both small and large run histories. Record the intended hierarchy, visible comparison attributes, editing-surface tradeoffs, and any hidden secondary settings. This design record belongs to the experiment output; it does not prescribe fixed panel positions or a particular visual theme.

After that workflow works, add a second node type with different settings. Existing interaction responsibilities and command targeting must remain coherent.

## Controlled comparison

Run the same brief, implementation stack, initial repository, dependencies, constraints, and development budget with and without the pack. Save model/version, prompts, discovered/read skill refs, assumptions, screenshots, task observations, and code artifacts. Do not give only one condition extra design feedback or prebuilt components. Repeat runs before treating one result as reliable evidence.

Begin with one platform, then repeat the relevant tasks on web, desktop, and mobile implementations. Platform-specific differences are expected; shared task outcomes and recovery principles remain comparable.

## Task walkthroughs

1. Open/create a workflow and identify the active document and available actions.
2. Add a node, select it, change settings, and observe the draft/commit policy.
3. Enter an invalid value, submit or apply, and correct the error without losing other input.
4. Change selection with an unfinished draft and verify the declared policy.
5. Run successfully; keep editing while a delayed run completes and inspect which document version the result represents.
6. Fail a run, inspect the reason, and retry with configuration preserved.
7. Navigate away or close a contextual surface, then return to the same task context.
8. Undo a reversible edit and distinguish it from an irreversible external operation.
9. Complete essential actions using keyboard input where supported and an accessible non-pointer alternative to canvas manipulation.
10. Repeat in a compact/resized layout and with a visible software keyboard where applicable.
11. Add the second node type and repeat the workflows; record any pattern drift.
12. Start with no workflows, clear a selection, apply a run-history filter with no matches, and fail the history request. Check whether each absent-content state has the correct explanation and next step.
13. Find Run and the editing entry point without hover or memorized shortcuts. Identify the current subject, action targets, field units, and active secondary settings before interacting.

## Observation rubric

Score each dimension 0 (blocked/undefined), 1 (works with inconsistencies), or 2 (coherent in the tested tasks): task completion, action targeting, location/selection clarity, draft preservation, error recovery, asynchronous state, keyboard/focus, adaptive layout, surface suitability, hierarchy and control discovery, comparison density, terminology, empty/disclosed states, and consistency after the feature addition. Record the observed evidence and affected task beside each score; do not substitute code style or aesthetic preference for task evidence.

Inspect rendered applications as well as source. Check capability requests, command results, event timing, state ownership, and adapter lifetimes as explanations for behavior. Architecture alone is not the outcome score.

## Current status

No application comparison or participant usability study has been run for this draft. Markdown scenarios and CLI integration tests establish content/discovery mechanics only. Before publication, review the architectural opinions, run the experiment, record weaknesses, and revise the smallest affected skills.
