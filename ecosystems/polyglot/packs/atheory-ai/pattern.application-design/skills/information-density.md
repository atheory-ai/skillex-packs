---
name: "Choose density for the work being done"
description: "Use when choosing compact versus spacious layouts, table versus card presentation, or how much detail to show for comparison and editing."
topics: ["application-design", "information-density"]
tags: ["app-builder", "ui-design", "layout"]
---

# Choose density for the work being done

Information density is a task decision. Show enough information together to support comparison, scanning, or manipulation while keeping content readable and controls usable. Neither maximum whitespace nor maximum items per screen is a universal goal.

Choose the attributes people need to compare before choosing a card or table. Repeated, aligned values can make differences easier to find than spacious cards. Exploratory items with substantial previews may benefit from more space. Separate frequently needed attributes from occasional detail rather than shrinking everything to fit.

Account for expected content volume, long values, localization, text enlargement, and input method. Compact presentation must not depend on clipped critical values or targets too small for the supported interaction. Resizing may change visible columns or surface arrangements; preserve access to omitted information and communicate sorting or filtering that still affects the result.

## Example

A run history compares workflow, outcome, start time, and duration in aligned rows. Logs and diagnostic details open for a selected run. Giving each run a large illustrated card reduces comparisons without helping the review task.

## Verify

Representative small and large datasets support finding and comparing the required values. Important text remains readable, and controls remain reachable at the intended density. [Carbon's table guidance](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) supplies concrete table-sizing examples; its sizes are system-specific rather than universal constants.
