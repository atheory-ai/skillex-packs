---
name: Authoring a Pack
description: Step-by-step guide for creating a new skillex pack — directory layout under packs/<handle>/, the pack.yaml manifest, skill files, tests, and the review checklist. Use when adding or proposing a new pack.
topics: [authoring, packs]
tags: [contributor-guide]
---

# Authoring a Pack

A pack is a directory of guidance that the skillex engine installs into a
target project after detecting that the pack applies. This skill builds one
from scratch. For the *naming* decisions it assumes you've read
`skills/naming-and-tiers.md`.

## Pre-requisites

- You've chosen the full name `<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]`:
  - **handle** = your verified GitHub login or an org you belong to. Use
    `atheory-ai` only if you are on `@atheory-ai/skillex-maintainers`.
  - **ecosystem** = the *language* (`javascript`, `python`, `go`, …), not
    the runtime.
  - **scope** = `lang` | `runtime` | `framework` | `metaframework` |
    `tool` | `library` | `pattern`.
- The name does not collide with an existing pack — check
  `registry/manifest.json` or grep the repo.

## Step 1 — create the directory

The path mirrors the name: `ecosystems/<ecosystem>/packs/<handle>/<scope>.<name>[.<descriptor>]/`.

Canonical Next.js pack:

```
ecosystems/javascript/packs/atheory-ai/metaframework.nextjs/
  pack.yaml
  README.md
  OWNERS
  CHANGELOG.md
  skills/
  tests/
```

Community flavored ESLint pack (owner `alice`):

```
ecosystems/javascript/packs/alice/tool.eslint.airbnb/
  pack.yaml
  README.md
  OWNERS
  CHANGELOG.md
  skills/
  tests/
```

## Step 2 — write `pack.yaml`

```yaml
name: atheory-ai.javascript.metaframework.nextjs   # full handle-first name
version: 0.1.0                                      # semver — see skills/versioning-a-pack.md
description: Next.js App Router patterns and gotchas
authors: [atheory-ai]
license: Apache-2.0
homepage: https://github.com/atheory-ai/skillex-packs/tree/main/ecosystems/javascript/packs/atheory-ai/metaframework.nextjs

compatibility:
  # runtime / language baseline lives here (ecosystem segment is the language)
  node: ">=20"            # or bun / deno for a JS pack; go / python elsewhere
  nextjs: ">=14 <16"
  skillex: ">=0.7 <2"

activation:
  detectors: [nextjs]                      # baked-in detector from the engine
  files-present:
    - next.config.{js,mjs,ts}

scopes:
  - subtree
    rooted-at: nearest-ancestor("next.config.*")

skills:
  - file: skills/routing.md
    activates-when:
      detector: nextjs
  - file: skills/server-actions.md
    activates-when:
      detector: nextjs
      files-matching: ["**/actions.{ts,js}"]
```

There is **no `tier:` field** — tier is derived from the handle. The
exhaustive schema lives in the engine repo at `internal/packs/pack.go`. Run
`npm run validate` to check yours.

## Step 3 — write the skills

Each `skills/<name>.md` is a regular skillex skill: YAML frontmatter +
markdown body. Keep them focused:

```markdown
---
name: Next.js Server Actions
description: When to reach for server actions vs route handlers, request lifetime, and the form-action interop story.
topics: [nextjs, server-actions]
tags: [framework]
---

# Server Actions

…content…
```

### Style guidance for pack skills

- **One topic per file.** A reader should predict the file name from a
  question.
- **Lead with the rule, then the reason.** Agents quote the first
  paragraph back to users; make it useful.
- **Cite versions where behavior changed** ("as of Next 14.2 …"). Keeps
  the pack honest about its compatibility range.
- **Avoid linking out** for load-bearing facts. Inline them.
- **No prompts to the agent.** Never write "as an AI assistant you
  should …" — that's prompt-injection bait and the linter flags it. Write
  factual, audience-neutral docs. See `skills/security-and-review.md`.

## Step 4 — write tests

`tests/<name>.test.md` files are presence/quality checks, not behavioral
tests: every skill has a matching test stub naming the question it answers
and a non-empty expected answer, so reviewers and CI catch abandoned skills.

```markdown
---
name: Next.js Server Actions — test
covers: skills/server-actions.md
---

# Q: When should I use a server action instead of a route handler?

Expected answer mentions: form submissions, progressive enhancement,
direct DB writes, and the cookie / header limitations.
```

## Step 5 — README and OWNERS

`README.md` describes the pack for humans (and the browsable registry index
site). Cover: the pack's opinions, who it's for, what it does *not* try to
do.

`OWNERS` is a flat list of GitHub handles, one per line, priority order:

```
@alice
@bob
@atheory-ai/skillex-maintainers   # optional team backstop for core packs
```

`OWNERS` is **maintenance routing, not a property right** — see
`skills/contributing-and-dco.md`.

## Step 6 — validate, sign off, PR

```
npm run validate                       # schema + lint + structural checks
git checkout -b pack/<name>
git commit -s -S -m "feat(pack): <name>@0.1.0"   # -s = DCO sign-off, -S = signed commit
git push -u origin pack/<name>
gh pr create --fill
```

Both `-s` (DCO `Signed-off-by`) and `-S` (cryptographic signature) are
required; CI rejects commits missing either on `main`. Details and the
full why in `skills/contributing-and-dco.md`.

## Review timeline

- Core pack (`atheory-ai.*`): 2 approvals, one a pack OWNER.
- New handle's first community pack: 1 approval from atheory-ai
  (anti-typosquat / anti-spam / anti-injection gate).
- Subsequent revisions: approval from the pack's OWNERS, routed via
  CODEOWNERS.

See `skills/security-and-review.md` for what the gate actually checks.

## What gets published when you merge

Merging does **not** publish. Publishing is triggered by pushing a release
tag `pack/<name>/v<semver>`, which runs the release workflow (validate →
deterministic tarball → cosign + SLSA → GitHub Release → manifest update).
See `skills/releasing-a-pack.md` and `.specs/05-distribution.md`.
