# Tests: releasing-a-pack.md

## Validation: how to publish

Prompt: I merged my pack to main but it isn't installable. How do I publish it?
Success criteria:
  - Merging does not publish; push a release tag `pack/<name>/v<semver>`.
  - The tag triggers the release workflow.

## Validation: what the workflow produces

Prompt: What artifacts does a pack release produce and how are they trusted?
Success criteria:
  - Deterministic tarball + SHA256 + cosign signature + SLSA L2 provenance, uploaded to a GitHub Release.
  - The signed manifest pins the SHA256; the engine refuses on mismatch.

## Validation: discovery surfaces

Prompt: Which place does the engine actually verify and install from?
Success criteria:
  - The canonical signed manifest and bundle committed on `main`.
  - Raw and the Worker transport the signed pair; the Pages index is human-facing. Verification is per-fetch.

## Validation: immutable schema correction

Prompt: The source example manifest is corrected, but the signed old release still fails engine validation. Can I replace its tarball or manually fix the registry manifest?
Success criteria:
  - Reject the old schema even when signature and SHA256 are valid.
  - Publish a new pack version through the protected workflow, then review the signed manifest update PR.
  - Do not overwrite immutable assets or hand-edit signed manifest bytes.
  - Offline refresh cannot discover revocations newer than its saved signed manifest.
