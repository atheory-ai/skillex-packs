---
name: Repository Conventions
description: How the skillex-packs registry is organized, how packs are named and grouped by owner handle, where spec changes go, and which directories belong to which language ecosystem. Start here when working in this repo.
topics: [repo-conventions]
tags: [getting-started, contributor-guide]
---

# skillex-packs — Repository Conventions

This repo is the canonical registry of skillex packs. **Packs are not code;
they are markdown + YAML + JSON that an agent reads as guidance.** The
engine in `atheory-ai/skillex` consumes the manifest this repo produces.

The `.specs/` directory is the source of truth for every rule below; this
skill is the fast orientation. When in doubt, read the cited spec.

## What this repo is *not*

- Not a place for generic prose. Use `.specs/` for design notes and
  pack-local `README.md` files for human-facing pack docs.
- Not a place to ship executable code that runs on user machines. The
  engine enforces a strict file allowlist at install time
  (`.md`, `.yaml`, `.yml`, `.json`, `.txt`). See `.specs/03-security.md`.

## Naming in one line

Packs are named **handle-first**:

```
<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]
```

- `handle` — the owner's verified GitHub login (user or org). `atheory-ai`
  is the canonical owner. There is **no tier segment**; trust tier is
  *derived* from the handle.
- `ecosystem` — the **language**, not the runtime (`javascript`, `python`,
  `go`, …). Next.js is `*.javascript.metaframework.nextjs` whether it runs
  on Node, Bun, or Deno.

See `skills/naming-and-tiers.md` and `.specs/01-naming-and-structure.md`.

## Directory layout

Packs are grouped by **owner handle**, mirroring the name:

- `ecosystems/<ecosystem>/packs/<handle>/<scope>.<name>[.<descriptor>]/`
  — e.g. `ecosystems/javascript/packs/atheory-ai/metaframework.nextjs/`
  is the source for `atheory-ai.javascript.metaframework.nextjs`.
- `.specs/` — design notes (start here when proposing a change to the
  registry model). Reading order is in `.specs/README.md`.
- `registry/` — build outputs (manifest + signatures); CI-generated.
- `scripts/` — validators, manifest builder, signing helpers.
- `skills/` — skills *about this repo*, used by agents that work here.

`ecosystems/<ecosystem>/` is a workspace (npm for `javascript`, a module
for `go`, a uv project for `python`). That tooling choice is independent of
the runtime a pack's subject targets.

## The lifecycle, and which skill covers it

| Stage | Skill |
|---|---|
| Name a pack, pick handle / ecosystem / tier | `skills/naming-and-tiers.md` |
| Create the pack (dirs, `pack.yaml`, skills, tests) | `skills/authoring-a-pack.md` |
| Version it / handle breaking changes / renames | `skills/versioning-a-pack.md` |
| Commit, sign off (DCO), open the PR | `skills/contributing-and-dco.md` |
| Pass the security & review gate | `skills/security-and-review.md` |
| Publish via release tag | `skills/releasing-a-pack.md` |
| Consume from one or many registries | `skills/registries-and-federation.md` |

## Validate before you PR

```
npm run validate     # skillex test — schema + lint + structural checks
```

## Working on the design itself

Spec changes go in `.specs/` first. Once a spec stabilizes the parts that
govern engine behavior, lift them into `atheory-ai/skillex` — this repo
implements what the engine spec mandates and should not invent new engine
semantics on its own.

## Licensing

The repo is Apache-2.0 (`LICENSE`, `NOTICE`). Contributions are inbound
under Apache-2.0 with a DCO sign-off per commit; contributors keep
copyright. See `skills/contributing-and-dco.md` and
`.specs/04-canonical-vs-community.md`, "Contribution terms & licensing".
