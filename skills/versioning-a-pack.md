---
name: Versioning a Pack
description: Pack semver and what counts as breaking, compatibility metadata (including how runtimes are expressed), coexisting major versions, when to fork into a new name, pack renames via replaces/superseded-by, and pre-release handling. Use when bumping a version or making a breaking change.
topics: [versioning, packs]
tags: [contributor-guide]
---

# Versioning a Pack

Source of truth: `.specs/02-versioning.md`.

## Semver — what counts as breaking

Packs use `MAJOR.MINOR.PATCH`.

| Change | Bump |
|---|---|
| Reworded content, added examples, typo fixes | PATCH |
| New skill, new optional activation rule | MINOR |
| Skill removed/renamed, activation rule made stricter, schema bump | MAJOR |
| `compatibility:` tightened to drop a previously-supported environment | MAJOR |
| `compatibility:` loosened to cover more | MINOR |

Intuition: *"would a project that was happy on the previous version stop
being happy?"* If yes, MAJOR.

## Compatibility metadata

**Registry-layer, forward-looking:** the engine has no `compatibility`
concept (it activates via detectors + `activate-when`), so this lives in
`pack.yaml`'s **`registry:` block** and the signed manifest — used by the
registry and the future install path, ignored by the engine today.

```yaml
registry:
  compatibility:
    # runtime / language baseline. For a JS pack the runtime lives here,
    # because the ecosystem segment is the language:
    node: ">=20"        # or bun / deno; or go / python in other ecosystems
    nextjs: ">=14 <16"  # framework / library ranges
    skillex: ">=0.7 <2" # engine version authored against
```

- All ranges use npm's semver grammar (normalized for Go/PyPI too) — one
  parser.
- Unknown detected runtime → runtime-dependent constraints are treated as
  unsatisfied; the pack won't auto-install (user can `--force`).
- A pack requiring `skillex: ">=2"` is ignored by a 1.x engine.

There is **no `not:` operator.** Exclude a single bad version by tightening
the range (`>=14 <14.2.3 || >14.2.3 <16`) or, for a security problem, via a
revocation (`skills/security-and-review.md`).

## Resolving which version installs

Filter manifest entries by name → keep those whose `compatibility` the
detected environment satisfies → pick the highest semver. Same algorithm as
npm / cargo / Go modules.

## Coexisting majors

Multiple majors live in the manifest at once; a Next 13 project gets the
`1.x` pack, a Next 15 project gets `2.x`. On disk we keep **one source
directory**; older majors live on a `maint/<name>-1.x` branch and `main`
carries the newest. Release tags are per pack+version (see
`skills/releasing-a-pack.md`).

## Fork into a new name vs. bump the major

Fork the **name** only when two eras share little:

- `atheory-ai.javascript.metaframework.nextjs.pages` (Pages router)
- `atheory-ai.javascript.metaframework.nextjs.app` (App router)

Rule of thumb: fork when skill files have **< ~30% overlap**; otherwise use
semver majors of one pack.

## Renames & supersession

When a pack is renamed — most often when a community pack is promoted to
core and republished under `atheory-ai.*` (the handle is the first segment,
so the name changes) — link the old and new names:

- `registry.superseded-by: <new-name>` on the **old** pack.
- `registry.replaces: <old-name>` on the **new** pack.

The engine follows the link on `update`/`install` so installs migrate
cleanly, after showing the rename in the diff. Supersession is **not** a
trust shortcut: a rename across handles still passes the full review gate.

## Pre-release versions

`-rc.1`, `-beta.2`, `-next.0` are supported but **opt-in**: the resolver
ignores them unless the user passes `--include-prerelease`. A stable range
never resolves to a pre-release.
