---
name: "Explain why a work surface has no content"
description: "Use when designing first-use, cleared, filtered, or unavailable content states; distinguish no data from loading, failure, and lack of access."
topics: ["application-design", "empty-states"]
tags: ["app-builder", "ui-design", "content", "feedback"]
---

# Explain why a work surface has no content

An empty surface explains why content is absent and what, if anything, can usefully happen next. First use, a filter with no matches, completed work, missing selection, and unavailable data do not have the same meaning.

Keep the explanation in the affected surface. Offer an action that addresses its actual cause when one exists. Do not invent a Create action for every blank area or imply that a failed request returned an empty dataset. Loading and access failures require their own truthful states. A valid absence, such as no active alerts, may need no corrective action.

First-use guidance can explain what will appear and how to begin without turning each panel into a tutorial. Example data must be clearly identified and safe to distinguish from the person's actual work.

## Example

An empty workflow list offers creation. A run history filtered to Failed explains that no runs match and offers a filter adjustment. An inspector with no selection points to selecting a node. A disconnected history shows a loading failure with a meaningful recovery action instead of “No runs yet.”

## Verify

Each absent-content state has an accurate cause and an appropriate next step or deliberate lack of one. Populating, clearing, filtering, and failing the same surface produce distinct outcomes. [Carbon's empty-state guidance](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states) describes contextual explanations and first-use alternatives.
