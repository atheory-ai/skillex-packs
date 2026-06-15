# 01 — Naming & Structure

## Principles

1. **Identity is the pack name**, not the path. Skillex resolves packs by
   name + version, never by filesystem location. Directory layout is a
   maintainer convenience.
2. **Versions live in version control, not directory names.** We do **not**
   create `nextjs-13/` and `nextjs-14/` directories. Major-version
   differences are expressed in pack metadata and tag history (see
   `02-versioning.md`).
3. **One pack, one source directory.** A pack directory contains exactly
   one `pack.yaml`. Multi-major support comes from publishing two pack
   versions from the same source directory at different points in time —
   or, when codebases truly diverge, from two distinct pack *names*
   (`nextjs-app` vs `nextjs-pages`), not two directories of the same name.

## Naming scheme

Pack names use a **dotted, scoped, lowercase** identifier:

```
<tier>.<ecosystem>.<scope>.<name>
```

| Segment | Values | Examples |
|---|---|---|
| `tier` | `core` (atheory-ai canonical) or `community` | `core`, `community` |
| `ecosystem` | language family / runtime | `node`, `go`, `python`, `java`, `ruby`, `rust`, `dotnet`, `polyglot` |
| `scope` | what kind of thing the pack is about | `lang` (language itself), `framework`, `metaframework`, `tool`, `library`, `pattern` |
| `name` | the thing | `nextjs`, `eslint`, `gin`, `prisma`, `effect`, `gradle` |

### Examples

| Name | Meaning |
|---|---|
| `core.node.lang.javascript` | Canonical pack for the JS language baseline (idioms, gotchas, async patterns) |
| `core.node.metaframework.nextjs` | Canonical Next.js pack |
| `core.node.tool.eslint` | Canonical ESLint config / rule rationale pack |
| `core.go.lang.go` | Canonical Go language pack |
| `core.go.framework.gin` | Canonical Gin pack |
| `core.python.metaframework.django` | Canonical Django pack |
| `community.node.metaframework.nextjs.strict` | Community fork with stricter opinions |
| `community.python.pattern.fastapi-clean-arch` | Community opinion pack |

### Why not `@scope/name` like npm?

We considered npm-style scopes (`@skillex/nextjs`, `@user/nextjs-strict`).
Rejected for two reasons:

- Skillex packs are not npm packages. Reusing npm syntax invites confusion
  (people will try `npm install @skillex/nextjs`).
- Dotted names sort and filter cleanly (`skillex packs available --tier=core
  --ecosystem=node`).

The npm scope `@atheory-ai/skillex-packs` is the *repo*; the contents are
addressed by dotted name.

### Reserved roots

`core.*` is reserved for atheory-ai-authored / -owned packs.
Community packs **must** use `community.*`. Engine will refuse to install a
non-canonical pack that claims a `core.*` name.

## Directory layout

```
ecosystems/
  node/
    package.json                            # npm workspace
    packs/
      core/
        lang.javascript/
          pack.yaml
          skills/*.md
          tests/*.test.md
        lang.typescript/
        metaframework.nextjs/
        tool.eslint/
      community/
        metaframework.nextjs.strict/        # community fork
  go/
    go.mod                                  # Go module
    packs/
      core/
        lang.go/
        framework.gin/
      community/
  python/
    pyproject.toml                          # uv / hatch project
    packs/
      core/
      community/
  java/
  ruby/
  rust/
  dotnet/
  polyglot/                                 # cross-ecosystem (docker, k8s, …)
    packs/
      core/
        tool.docker/
        tool.kubernetes/
```

Notes:

- Each `ecosystems/<eco>/` is a **workspace** in the top-level monorepo.
  For Node this means an npm workspace; for Go a separate module; for
  Python a uv project. The monorepo top-level only needs Node tooling
  (we use skillex itself from Node).
- The directory name under `packs/core/` is the **pack short name** —
  the suffix after `core.<ecosystem>.`. So
  `ecosystems/node/packs/core/metaframework.nextjs/` is the source for
  `core.node.metaframework.nextjs`.
- Community packs put their author handle inside the directory only if
  the name itself doesn't disambiguate, e.g.
  `community/metaframework.nextjs.alice-strict/`.

## What's inside a pack directory

```
metaframework.nextjs/
  pack.yaml              # manifest — schema defined in engine repo
  README.md              # human-facing description (also shown in registry)
  OWNERS                 # GitHub handles for review routing
  skills/
    routing.md           # skill files (yaml frontmatter + markdown)
    data-fetching.md
    server-actions.md
    middleware.md
  tests/
    routing.test.md      # .test.md fixtures validated by `skillex test`
  CHANGELOG.md           # human-readable change history
```

`pack.yaml` keys (locked in v1 — engine `internal/packs/pack.go` is the
source of truth):

```yaml
name: core.node.metaframework.nextjs
version: 1.4.0
description: Next.js App Router patterns and gotchas
authors:
  - atheory-ai
license: Apache-2.0
homepage: https://github.com/atheory-ai/skillex-packs

compatibility:                # see 02-versioning.md
  nextjs: ">=14 <16"
  node: ">=20"

activation:                   # how skillex decides this pack applies
  detectors:                  # ecosystem detectors from the engine
    - nextjs
  files-present:
    - next.config.{js,mjs,ts}

scopes:                       # which files / dirs the skills apply to
  - subtree                   # all files under the Next.js root
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

## Monorepo workspace boundaries

Why workspaces-per-ecosystem rather than one flat workspace?

- **Tooling separation.** Go packs may want Go-native validators; Python
  packs may want `pytest` to validate their fixtures. Each ecosystem can
  bring its own dev tooling without polluting Node's `node_modules`.
- **CI parallelism.** A change in `ecosystems/go/**` triggers only the Go
  lane.
- **CODEOWNERS clarity.** Reviewers for `ecosystems/python/**` are Python
  experts; they don't need notifications on JS pack PRs.

The trade-off: cross-ecosystem refactors are mildly more annoying. The
`polyglot/` workspace exists exactly for things that span ecosystems
(Docker, Kubernetes, OpenAPI) and don't fit a single language.

## Open questions

- Do we want `community.<author>.<rest>` (author segment up front) instead
  of `community.<ecosystem>.<scope>.<name>.<flavor>`? Author-first is more
  npm-like and gives community authors a clear "namespace"; ecosystem-first
  makes `skillex packs available --ecosystem=node` give a complete list
  including community options. Current lean: ecosystem-first, with author
  attribution in `pack.yaml.authors`.
- Should we permit aliases (`core.nextjs` short for
  `core.node.metaframework.nextjs`)? Nice for humans, dangerous for
  collision. Defer.
