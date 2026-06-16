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
  - The canonical GitHub Release `manifest/v<n>`.
  - Raw, the Worker endpoint, and the Pages index are advisory/human-facing; verification is per-fetch.
