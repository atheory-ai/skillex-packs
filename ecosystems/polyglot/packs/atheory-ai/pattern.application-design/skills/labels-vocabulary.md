---
name: "Name subjects and outcomes consistently"
description: "Use when writing navigation names, action labels, field labels, units, and instructions, especially when generic labels or inconsistent terms obscure meaning."
topics: ["application-design", "labels-vocabulary"]
tags: ["app-builder", "ui-design", "content"]
---

# Name subjects and outcomes consistently

Interface language uses the vocabulary of the user's work. Name the same object consistently across navigation, editing, and feedback. Action labels describe the intended operation or outcome closely enough that people can predict its effect in context.

Distinguish concepts that behave differently: Save a document, Apply a draft, and Run a workflow are separate outcomes. Generic labels such as OK or Submit can fit established contexts, but they should not conceal a consequential or ambiguous choice. Keep technical identifiers out of labels unless the intended audience actually works with them.

Field labels remain identifiable after a value is entered. Units and essential constraints belong in associated labels or instructions, not only in placeholders or error messages. Visible wording and accessible names should identify the same control. On the web, programmatic association is required as well as visual proximity.

## Example

An inspector labels a field “Timeout (seconds)” rather than “Value.” Applying its settings says “Apply node settings”; running the document says “Run workflow.” A rejected value refers to that same timeout field. The application does not alternate between node, block, and step for one object.

## Verify

Labels make sense with realistic values and surrounding context. Terminology stays stable after a second feature is added. Essential instructions remain available while editing. [W3C's labeling guidance](https://www.w3.org/WAI/tutorials/forms/labels/) explains associated labels and accessible control names.
