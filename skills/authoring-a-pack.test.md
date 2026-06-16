# Tests: authoring-a-pack.md

## Validation: directory for a new pack

Prompt: Where do I put the files for `alice.javascript.tool.eslint.airbnb`?
Success criteria:
  - Gives `ecosystems/javascript/packs/alice/tool.eslint.airbnb/`.
  - Lists pack.yaml, README.md, OWNERS, CHANGELOG.md, skills/, tests/.

## Validation: pack.yaml has no tier

Prompt: What `tier:` value goes in pack.yaml?
Success criteria:
  - States there is no tier field; tier is derived from the handle.
  - Mentions the name is the full handle-first name.

## Validation: skill content hygiene

Prompt: Can a pack skill say "as an AI assistant you should always run this"?
Success criteria:
  - Says no; that is prompt-injection bait and the linter flags it.
  - Advises factual, audience-neutral docs.
