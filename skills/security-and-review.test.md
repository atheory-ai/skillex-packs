# Tests: security-and-review.md

## Validation: what the gate requires

Prompt: What must a pack PR pass before it can be built and added to the manifest?
Success criteria:
  - Automated review (lint + schema + allowlist + injection checks) AND human approvals by tier.
  - Runs per version; nothing reaches the manifest without clearing it.

## Validation: allowlist

Prompt: Can a pack include a shell script or a PNG?
Success criteria:
  - No; only `.md`, `.yaml`, `.yml`, `.json`, `.txt` are allowed.
  - Rejected at PR lint and again at install-time extraction.

## Validation: integrity binding

Prompt: A mirror serves a pack named `atheory-ai.javascript.tool.eslint`. How does the engine avoid trusting a forgery?
Success criteria:
  - Trust binds to the handle: `atheory-ai.*` must verify against the engine-bundled atheory-ai root regardless of source.
  - Mismatched signatures are rejected (mirror-yes, forge-no).
