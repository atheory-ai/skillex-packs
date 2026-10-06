# Tests: framework-adapters.md

## Validation: Keep hooks at the framework boundary

Prompt: Where should a React useSelection hook own selection state and mutation rules?
Success criteria:
  - Keeps simple view-only behavior local rather than requiring a shared service or event for every toggle.
  - Places canonical selection state and mutation rules in an explicit model.
  - Uses the hook as a lifecycle/rendering adapter with unsubscribe behavior.
  - Avoids requiring React hooks on native platforms.
