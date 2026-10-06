---
name: "Make available interactions discoverable"
description: "Use when choosing controls and interaction states, including icon-only actions, hover controls, editable values, drag handles, and disabled actions."
topics: ["application-design", "control-affordances"]
tags: ["app-builder", "ui-design", "interaction"]
---

# Make available interactions discoverable

Controls communicate what can be done and what interaction will do. Use established platform control patterns where their behavior fits. Distinguish operations, navigation, choices, and editable values rather than making them all look like interchangeable decorated text.

Provide recognizable boundaries or cues, readable labels where needed, and coherent default, focus, pressed, selected, and unavailable states. An unavailable action may need an explanation when the reason helps someone proceed. A pointer cursor or tooltip alone is insufficient discovery for touch and keyboard users.

Secondary controls may appear contextually when a clear entry point remains. Frequent essential actions need a reachable alternative to hover, dragging, or memorized shortcuts. Extra visual decoration is not a substitute for an understandable interaction.

## Example

A node name looks editable only if editing is supported and its entry mechanism is discoverable. A drag handle communicates movement, while a nearby menu provides the same essential operation without dragging. A contextual Delete control does not impersonate navigation or appear solely when a pointer happens to hover.

## Verify

A task walkthrough can find and identify essential controls before activating them. Equivalent controls keep their meaning and state cues across features. Touch, keyboard, and assistive-technology paths expose the same necessary operations. [GOV.UK button guidance](https://design-system.service.gov.uk/components/button/) illustrates labeled actions and differentiated button roles for its service context.
