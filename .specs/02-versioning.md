# 02 — Versioning

## TL;DR

- **Packs use semver.** `MAJOR.MINOR.PATCH`.
- **Compatibility with the world outside the pack** lives in
  `pack.yaml → compatibility:`, not in the directory name.
- **Multiple pack major versions can coexist** in the registry and the
  engine picks the highest one compatible with the detected environment.
- **One source directory normally yields one pack name.** Forks for
  fundamentally incompatible eras (e.g. Next.js Pages vs App routers)
  should be **separate pack names**, not separate directories of the same
  name.

## Pack semver — what counts as breaking

| Change | Bump |
|---|---|
| Skill content reworded, examples added, typos fixed | PATCH |
| New skill added, new optional activation rule | MINOR |
| Skill removed, skill renamed, activation rule made stricter, schema bump | MAJOR |
| `compatibility:` range tightened in a way that drops support for an environment we previously claimed to support | MAJOR |
| `compatibility:` range loosened to cover more | MINOR |

The intuition: "would a project that was happy on the previous version stop
being happy?" If yes, MAJOR.

## Compatibility metadata

Every pack version declares which world it works in:

```yaml
compatibility:
  # Required: runtime / language baseline. For JavaScript this is the
  # runtime (node/bun/deno) — the ecosystem segment is the language, so the
  # runtime lives here. For Go/Python the toolchain and language coincide.
  node: ">=20"          # or `bun: ">=1.1"`, `deno: ">=1.4"`, `go: ">=1.22"`, `python: ">=3.11"`

  # Optional: framework / library versions, expressed as semver ranges
  nextjs: ">=14 <16"
  react: ">=18"
  prisma: ">=5"

  # Optional: skillex engine version this pack was authored against
  skillex: ">=0.7 <2"
```

Rules:

- Ranges follow npm's [`semver`](https://github.com/npm/node-semver) grammar
  for everything (yes, even for Go modules and PyPI — we normalize
  upstream). This is one parser to maintain.
- Engine matches a pack version against detected versions:
  - **Detected** versions come from the resolver (Node: `package.json`
    dependency tree; Go: `go.mod`; Python: `pyproject.toml` / `uv.lock`).
  - If the detected runtime is unknown (no resolver data), `compatibility`
    constraints that depend on it are treated as **unsatisfied** — the pack
    will not auto-install. The user can `--force` if they know better.
- A pack with `skillex: ">=2"` will be ignored by a 1.x engine, even if
  everything else matches.

## Resolving "which version do I install?"

Given a detected project and a registry manifest:

1. Filter manifest entries by name (`atheory-ai.javascript.metaframework.nextjs`).
2. From those, keep entries whose `compatibility` is satisfied by the
   detected environment.
3. Of the remaining, pick the **highest semver**.
4. If none match, surface a "no compatible version" diagnostic that
   shows the closest miss (helpful for upgrade hints).

This is the same algorithm npm / cargo / Go modules use; it's well-trodden.

## Multiple coexisting majors

Both of these live in the registry at the same time:

```
atheory-ai.javascript.metaframework.nextjs@1.7.2
  compatibility: { nextjs: ">=13 <14" }

atheory-ai.javascript.metaframework.nextjs@2.4.0
  compatibility: { nextjs: ">=14 <16" }
```

A Next.js 13 project installs `1.7.2`; a Next.js 15 project installs
`2.4.0`. They don't interfere.

**On disk in this repo we keep one source directory** (`ecosystems/javascript/
packs/atheory-ai/metaframework.nextjs/`). The `1.x` source is on the
`maint/nextjs-1.x` branch; `main` carries `2.x`. We tag releases
`pack/atheory-ai.javascript.metaframework.nextjs/v2.4.0`. See `05-distribution.md`
for the tag scheme.

This keeps `main` clean and forces maintainers to consciously cherry-pick
fixes back to `1.x` — a healthy discipline.

## When to fork into a new pack name instead

If two eras of a framework are so different that a single team can't
realistically maintain both with shared muscle memory, fork the name:

- `atheory-ai.javascript.metaframework.nextjs.pages` (Pages router era)
- `atheory-ai.javascript.metaframework.nextjs.app`   (App router era)

This is the **directory-level fork** option the user flagged. Use sparingly
— each pack name is a separate review queue, OWNERS file, and
documentation surface.

Rule of thumb: fork the name when the **skill files have less than ~30%
overlap** between versions. Below that threshold, semver majors of one pack
is the correct model.

## Versioning the registry manifest itself

The manifest format (`registry/manifest.json`) is itself versioned:

```json
{ "schemaVersion": 1, "generatedAt": "2026-06-15T…", "packs": [ … ] }
```

A `schemaVersion` bump is a breaking change to **all** engine clients.
Treat it as we would treat an engine major. Defer schema changes; prefer
adding optional fields.

## Renames & supersession

When a pack is renamed — most commonly when a community pack is promoted to
core and republished under the `atheory-ai` handle
(`04-canonical-vs-community.md`), since the handle is the first name
segment — the old name does not silently disappear. Two optional fields
express the link in `pack.yaml`, mirrored into the manifest entry:

- `superseded-by: <new-name>` on the **old** pack — "I am retired; install
  `<new-name>` instead."
- `replaces: <old-name>` on the **new** pack — the inverse pointer, so the
  chain is walkable from either end.

Engine behavior:

- On `skillex packs update`, a locally-installed pack carrying
  `superseded-by` resolves to its successor (subject to the same
  `compatibility` filtering), after showing the rename in the install diff.
- A fresh `skillex packs install <old-name>` warns and installs the
  successor.
- Supersession is **not** a trust shortcut: a rename across handles
  (community → core) still passes the full review gate for the new pack.

This is the `replaces` / `superseded-by` chain referenced by core-pack
deprecation in `04-canonical-vs-community.md` and carried in the manifest
(`05-distribution.md`).

## Pre-release versions

Pre-release semver tags (`-rc.1`, `-beta.2`, `-next.0`) are supported but
**opt-in**: the resolver ignores them unless the user passes
`--include-prerelease`. A stable range never resolves to a pre-release, so
publishing `2.0.0-rc.1` cannot surprise a project tracking `^1`. This
matches npm / cargo behavior and keeps the default install path boring.

## Resolved

- **No `not:` operator in `compatibility`.** `compatibility` uses plain
  semver ranges only. A single known-bad version is excluded the normal
  way — tighten the range (`>=14 <16` → `>=14 <14.2.3 || >14.2.3 <16`) or,
  for a security problem, use a `revocations` entry (`03-security.md`).
  Adding a bespoke `not:` operator isn't worth the extra resolver surface.
