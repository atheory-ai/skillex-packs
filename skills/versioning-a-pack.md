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

Declare engine compatibility in the source pack:

```yaml
registry:
  compatibility:
    skillex: ">=1 <2"
    node: ">=20"
```

Skillex 0.14.0 selects the newest advertised stable pack compatible with the
running engine. Other runtime ranges are advisory. Changing which engines a
pack supports requires a new pack release.

## Coexisting majors

Before or alongside the version bump, add the supported older release to
`registry/supported-versions.json` as an object with `name` and exact `version`.
Choose a release still present in the signed catalog. The publisher carries
forward its original compatibility and archive pin. The current source release
is advertised automatically.

Remove an older release from the list to retire it from discovery. Dispatch
`release-manifest` and merge the resulting catalog PR to publish the change.
For an unsafe release, publish a reviewed revocation as well so clients can
disable installed guidance with `skillex pack check`.

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

A fresh `skillex pack get` installs the requested name. Keep the announcing
release discoverable so installed clients can see the successor in
`skillex pack update --preview`. Each rename requires explicit
`--replace old-name=new-name` consent, including moves across handles.

## Pre-release versions

`-rc.1`, `-beta.2`, `-next.0` are supported but **opt-in**: the resolver
ignores them unless the user passes `--include-prerelease`. A stable range
never resolves to a pre-release.
