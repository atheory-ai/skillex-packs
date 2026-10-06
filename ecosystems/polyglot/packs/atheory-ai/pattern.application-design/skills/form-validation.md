---
name: "Validate at useful moments"
description: "Use when deciding validation timing, field association, cross-field errors, and rejected-submission recovery while retaining input."
topics: ["application-design", "forms"]
tags: ["app-builder", "forms", "validation"]
---

# Validate at useful moments

Validation explains what needs to change at a useful moment. Use labels and instructions before entry, field feedback after a meaningful interaction, and a submission summary when multiple corrections are needed. Avoid presenting errors merely because an untouched form is incomplete.

Use the authoritative domain rules for acceptance. Keep entered values after rejection. Cross-field problems identify the affected group or operation rather than attaching blame to an arbitrary field.

## Example

A workflow schedule needs both a timezone and a start time. A rejected submission retains both entries, identifies the inconsistent combination, and provides a reachable correction target. Correcting one error does not clear unrelated input.

## Verify

Each message explains the issue and an available correction. Error state is associated with its input and discoverable through assistive technology. A failed submission provides useful orientation without stealing focus on every keystroke. [W3C's form notification guidance](https://www.w3.org/WAI/tutorials/forms/notifications/) covers error identification and notification patterns.
