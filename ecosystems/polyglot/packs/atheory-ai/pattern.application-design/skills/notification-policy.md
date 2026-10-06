---
name: "Choose feedback from intent and context"
description: "Use when choosing inline feedback, history, transient notifications, or interruption from urgency, persistence, and recovery needs."
topics: ["application-design", "notifications"]
tags: ["app-builder", "feedback", "notifications"]
---

# Choose feedback from intent and context

A notification policy selects presentation from the user's task, the affected object, urgency, required action, and required persistence. Features report intent through a capability contract. A transient notification is appropriate only when losing it does not prevent understanding or recovery.

Keep field errors attached to fields and operation outcomes attached to their operation. Reserve interruption for decisions that genuinely block safe continuation. Define deduplication and announcement behavior; repeated visual feedback should not create repeated assistive-technology interruptions.

## Example

An export completion can offer a download action in operation history and unobtrusive feedback while editing continues. A rejected timeout value remains beside its field. A decision about overwriting another person's changes requires an explicit resolution surface.

## Verify

A user returning later can find outcomes that remain actionable. Feedback explains what happened and the next step without relying on color. Important errors are not available only in disappearing toasts. Accessible error association and announcements are described in [W3C form notification guidance](https://www.w3.org/WAI/tutorials/forms/notifications/).
