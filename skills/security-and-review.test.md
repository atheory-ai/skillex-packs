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

## Validation: withdraw a version between releases

Prompt: A maintainer needs to withdraw one published pack version today. What is the publication and consumer procedure?
Success criteria:
  - Add the exact name, version, and public reason to the reviewed revocations list, retaining earlier withdrawals.
  - Dispatch the manifest workflow from main after merge and merge its reviewed signed catalog PR.
  - Use pack check on a supporting engine to apply the signed withdrawal to an existing installation.
