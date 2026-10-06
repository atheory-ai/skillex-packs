---
name: "Reveal secondary detail without hiding task essentials"
description: "Use when deciding what stays visible and what goes behind an expander, menu, or secondary view, including advanced settings and optional explanations."
topics: ["application-design", "progressive-disclosure"]
tags: ["app-builder", "ui-design", "content"]
---

# Reveal secondary detail without hiding task essentials

Progressive disclosure defers secondary detail while keeping the current task understandable and complete. Hide information because it is conditional or infrequently needed, not simply because a screen looks busy. A disclosure entry communicates what it reveals and whether it contains relevant state.

Keep required fields, important consequences, and current blocking problems discoverable. A hidden section with changed values or validation errors needs a meaningful summary or indicator, and a path to the affected content. Revealing secondary settings must not silently reset them when they are collapsed again.

Decide what different task contexts actually require. An advanced option for one workflow can be routine for another; a single global “advanced” bucket can become a miscellaneous storage area. Prefer meaningful groups with predictable entry points. Disclosure complements suitable density and grouping rather than compensating for an incoherent form.

## Example

A run configuration keeps workflow and destination visible. An optional Retry policy section shows whether retries are enabled and preserves edited values while collapsed. If an invalid retry interval blocks execution, the error summary identifies that section and reaches the field. The section does not conceal a mandatory destination.

## Verify

The initial view supports the common complete task. Secondary options can be found when needed, and active hidden settings do not surprise the user. [GOV.UK details guidance](https://design-system.service.gov.uk/components/details/) illustrates revealing optional detail; this pack's state and error rules also apply to interactive settings.
