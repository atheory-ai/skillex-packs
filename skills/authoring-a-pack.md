---
name: Authoring a Pack
description: Step-by-step guide for creating a new skillex pack — directory layout, pack.yaml manifest, skill files, tests, and the review checklist. Use when adding or proposing a new pack.
topics: [authoring, packs]
tags: [contributor-guide]
---

# Authoring a Pack

A pack is a directory of guidance that the skillex engine can install into a
target project after detecting that the pack applies. This skill explains
how to build one from scratch.

## Pre-requisites

- You know which **ecosystem** (`node` | `go` | `python` | …), **scope**
  (`lang` | `framework` | `metaframework` | `tool` | `library` | `pattern`),
  and **name** the pack will use. See `.specs/01-naming-and-structure.md`.
- You have OWNERS for it (yourself + at least one backup for community).
- The pack name does not collide with an existing one — check
  `registry/manifest.json` if you can; otherwise grep the repo.

## Step 1 — create the directory

For a canonical Next.js pack:

```
ecosystems/node/packs/core/metaframework.nextjs/
  pack.yaml
  README.md
  OWNERS
  CHANGELOG.md
  skills/
  tests/
```

For a community flavored ESLint pack:

```
ecosystems/node/packs/community/tool.eslint.airbnb-strict/
  pack.yaml
  README.md
  OWNERS
  CHANGELOG.md
  skills/
  tests/
```

## Step 2 — write `pack.yaml`

```yaml
name: core.node.metaframework.nextjs       # full dotted name
version: 0.1.0                             # semver — bump per .specs/02-versioning.md
description: Next.js App Router patterns and gotchas
authors: [atheory-ai]
license: Apache-2.0
homepage: https://github.com/atheory-ai/skillex-packs/tree/main/ecosystems/node/packs/core/metaframework.nextjs

compatibility:
  nextjs: ">=14 <16"
  node: ">=20"
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

The exhaustive schema lives in the engine repo at
`internal/packs/pack.go`. Run `npm run validate` to check yours.

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

- **One topic per file.** A reader should be able to predict the file
  name from a question.
- **Lead with the rule, then the reason.** Agents will quote the first
  paragraph back to users; make it useful.
- **Cite versions where behavior changed** (e.g. "as of Next 14.2 the
  default cache behavior is …"). This ages well and keeps the pack
  honest about its compatibility range.
- **Avoid linking out** for load-bearing information. Links can rot;
  inline the key facts.
- **No prompts to the agent.** Don't write "as an AI assistant you
  should …" — that's prompt injection bait. Write factual,
  audience-neutral docs.

## Step 4 — write tests

`tests/<name>.test.md` files validate the structural quality of the
pack: every skill has a matching test stub, the test calls out which
question it answers, and the expected answer is non-empty.

These are not behavioral tests of the agent; they are presence checks
so reviewers and CI can spot abandoned skills.

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

`README.md` describes the pack for humans (and is shown on the registry
index site, if/when we build it). Cover: what the pack opinions are,
who it's for, and what it doesn't try to do.

`OWNERS` is a flat list of GitHub handles, one per line, in priority
order:

```
@alice
@bob
@atheory-ai/skillex-maintainers   # optional team backstop for core packs
```

## Step 6 — validate and PR

```
npm run validate      # schema + lint + structural checks
git checkout -b pack/<name>
git commit -s -m "feat(pack): <name>@0.1.0"
git push -u origin pack/<name>
gh pr create --fill
```

Sign your commits. CI will refuse unsigned commits on `main`.

## Review timeline

- Core pack: 2 approvals, one must be from the pack OWNERS.
- New community pack: 1 approval from atheory-ai.
- Subsequent community pack revisions: approval from the pack's OWNERS,
  routed via CODEOWNERS.

## What gets published when you merge

Merging does **not** publish. Publishing is triggered by pushing a
release tag in the form `pack/<name>/v<semver>`. That tag triggers the
release workflow which validates, builds a deterministic tarball, signs
it, uploads to a GitHub Release, and updates the manifest. See
`.specs/05-distribution.md`.
