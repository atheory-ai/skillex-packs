# Tests: versioning-a-pack.md

## Validation: classify a breaking change

Prompt: I removed a skill from a pack and tightened its compatibility to drop Node 18. What semver bump?
Success criteria:
  - MAJOR.
  - Reasons that a previously-happy project would stop being happy.

## Validation: exclude a bad version

Prompt: How do I exclude exactly nextjs 14.2.3 from a pack's compatibility?
Success criteria:
  - Tightens the semver range (e.g. `>=14 <14.2.3 || >14.2.3 <16`), or uses a revocation for a security issue.
  - Notes there is no `not:` operator.

## Validation: promotion rename

Prompt: A community pack is promoted to core. How do consumers keep working under the new name?
Success criteria:
  - Old pack gets `superseded-by`, new pack gets `replaces`.
  - Engine follows the link on update/install; the rename still passes review.
