---
name: Repository Conventions
description: How the skillex-packs registry is organized, how to add or modify packs, where to put spec changes, and which directories belong to which language ecosystem.
topics: [repo-conventions]
tags: [getting-started]
---

# skillex-packs — Repository Conventions

This repo is the canonical registry of skillex packs. **Packs are not code;
they are markdown + YAML + JSON that an agent reads as guidance.** The
engine in `atheory-ai/skillex` consumes the manifest this repo produces.

## What this repo is *not*

- It is not a place to put generic prose or notes. Use `.specs/` for design
  notes and pack-local `README.md` files for human-facing pack docs.
- It is not a place to ship executable code that runs on user machines.
  The engine enforces a strict file allowlist at install time
  (`.md`, `.yaml`, `.yml`, `.json`, `.txt`).

## Directory layout

- `ecosystems/<eco>/packs/core/<short-name>/` — canonical (atheory-ai) packs
- `ecosystems/<eco>/packs/community/<short-name>/` — community packs
- `.specs/` — design notes (start here when proposing a change to the
  registry model)
- `registry/` — build outputs (manifest + signatures); CI-generated
- `scripts/` — validators, manifest builder, signing helpers
- `skills/` — skills *about this repo*, used by agents that work here

See `.specs/01-naming-and-structure.md` for the full naming scheme.

## Adding or modifying a pack — checklist

1. Edit / add files under `ecosystems/<eco>/packs/<tier>/<short-name>/`.
2. Bump the `version:` in `pack.yaml` following semver (see
   `.specs/02-versioning.md` for what counts as breaking).
3. Update `CHANGELOG.md` inside the pack directory.
4. Run `npm run validate` — this runs schema + lint + skill-structure
   checks via `skillex test`.
5. Open a PR. Core packs need 2 approvals (one OWNER); community packs
   need 1 approval from atheory-ai for the **first** version, then
   pack OWNERS for subsequent revisions.

## Security gates

Any change to a pack triggers `scripts/lint-pack.mjs`. It will reject:

- Files outside the allowlist
- Hidden / zero-width / RTL-override characters
- Raw HTML in skill content
- IDN-encoded URLs
- Claims to a `core.*` name from outside `ecosystems/*/packs/core/`

See `.specs/03-security.md` for the full threat model and mitigations.

## Working on the design itself

Spec changes go in `.specs/` first. Once a spec stabilizes the parts that
govern engine behavior should be lifted into `atheory-ai/skillex` — this
repo can implement what the engine spec mandates but should not invent new
engine semantics on its own.
