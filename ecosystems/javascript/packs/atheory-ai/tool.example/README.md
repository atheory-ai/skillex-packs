# atheory-ai.javascript.tool.example

A minimal example pack used to exercise the registry build pipeline (lint →
deterministic tarball → manifest). It ships no real guidance.

- **What it is:** a pipeline smoke-test pack.
- **Who it's for:** registry maintainers verifying tooling.
- **What it does not do:** provide any actual JavaScript/tooling advice.

## Verified-consumer rollout

The published 0.1.0 archive predates the engine-compatible manifest correction
in #17. A strict consumer rejects it even though its signature and checksum
are valid. Source changes do not replace immutable release bytes.

After merging this correction, maintainers must publish
`pack/atheory-ai.javascript.tool.example/v0.1.1` through the protected release
workflow, then review and merge the newly signed registry manifest update.
The engine release containing the verified `pack get` consumer must also be
available before testing installation. Do not replace the 0.1.0 asset or
hand-edit the signed registry manifest.
