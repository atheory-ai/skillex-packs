# Tests: repo.md

## Validation: locate a pack's source

Prompt: Where does the source for `atheory-ai.javascript.metaframework.nextjs` live in this repo?
Success criteria:
  - Names the path `ecosystems/javascript/packs/atheory-ai/metaframework.nextjs/`.
  - Explains packs are grouped by owner handle, mirroring the name.

## Validation: where design changes go

Prompt: I want to change how pack naming works. Where do I start?
Success criteria:
  - Directs the change to `.specs/` first.
  - Notes engine-governing rules are lifted into `atheory-ai/skillex`.
