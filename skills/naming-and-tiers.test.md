# Tests: naming-and-tiers.md

## Validation: name a community pack

Prompt: Alice wants to publish a stricter ESLint config pack for JavaScript. What is its full name and why?
Success criteria:
  - Produces a handle-first name like `alice.javascript.tool.eslint.strict`.
  - Notes the handle is Alice's verified GitHub login and there is no tier segment.

## Validation: ecosystem is the language

Prompt: A Next.js project runs on Bun. Should the pack be named under a `bun` ecosystem?
Success criteria:
  - Says no; ecosystem is the language, so it is `*.javascript.metaframework.nextjs`.
  - Explains runtimes go in `compatibility:` or `runtime`-scope packs.

## Validation: derived tier

Prompt: Does publishing under the verified `vercel` org automatically make a pack "official"?
Success criteria:
  - Says no; official is granted explicitly by atheory-ai and recorded in the manifest.
  - Notes verification only proves handle ownership.
