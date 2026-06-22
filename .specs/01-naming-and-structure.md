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

Pack names use a **dotted, scoped, lowercase** identifier whose first
segment is the **owner handle**:

```
<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]
```

| Segment | Values | Examples |
|---|---|---|
| `handle` | the owner's **GitHub login — user or org** (verified, see below). `atheory-ai` is the canonical owner. | `atheory-ai`, `vercel`, `alice`, `acme-labs` |
| `ecosystem` | the **language / package ecosystem** — not the runtime | `javascript`, `python`, `go`, `rust`, `ruby`, `java`, `kotlin`, `csharp`, `polyglot` |
| `scope` | what kind of thing the pack is about | `lang` (language itself), `runtime` (node/bun/deno/jvm/…), `framework`, `metaframework`, `tool`, `library`, `pattern` |
| `name` | the thing | `nextjs`, `eslint`, `gin`, `prisma`, `effect`, `gradle` |
| `descriptor` | optional leaf distinguishing several packs from the same owner for the same target | `strict`, `minimal`, `airbnb` |

There is **no `tier` segment**. Trust tier (canonical / official /
community) is *derived* from the handle and its verification status and
shown by the engine — see "Tiers are derived from the handle" below and
`04-canonical-vs-community.md`.

### Examples

| Name | Meaning |
|---|---|
| `atheory-ai.javascript.lang.javascript` | Canonical pack for the JS language baseline (idioms, gotchas, async patterns) |
| `atheory-ai.javascript.metaframework.nextjs` | Canonical Next.js pack |
| `atheory-ai.javascript.tool.eslint` | Canonical ESLint config / rule rationale pack |
| `atheory-ai.go.lang.go` | Canonical Go language pack |
| `atheory-ai.go.framework.gin` | Canonical Gin pack |
| `atheory-ai.python.metaframework.django` | Canonical Django pack |
| `vercel.javascript.metaframework.nextjs` | Vercel's own official Next.js pack |
| `alice.javascript.metaframework.nextjs.strict` | Alice's community fork with stricter opinions |
| `bob.python.pattern.fastapi.clean-arch` | Bob's community opinion pack |

### Ecosystem is the language, not the runtime

The `<ecosystem>` segment names the **language / package ecosystem**, not
the runtime that executes it. Next.js is a JavaScript framework whether it
runs on Node, Bun, Deno, or an edge runtime, so it is
`*.javascript.metaframework.nextjs` — once — not duplicated per runtime.
This keeps the segment consistent with `go`, `python`, `rust` (all
languages) and matches how package ecosystems actually partition the world
(npm spans Node/Bun/Deno; PyPI↔Python; crates.io↔Rust). TypeScript belongs
to the `javascript` family — it shares npm and compiles to JS — so
TS-specific guidance is `*.javascript.lang.typescript`.

Runtimes are modelled two ways, **never** as the ecosystem segment:

- **As compatibility** — a pack declares the runtimes/versions it targets,
  e.g. `compatibility: { node: ">=20", bun: ">=1.1" }` (see
  `02-versioning.md`); the engine's detectors identify the project's runtime.
- **As `runtime`-scope packs** — runtime-specific idioms get their own
  pack, e.g. `atheory-ai.javascript.runtime.bun`,
  `atheory-ai.javascript.runtime.deno`.

The same rule covers platforms that host several languages: the JVM
(`java`, `kotlin`, `scala`, …) and .NET/CLR (`csharp`, `fsharp`, …) are
runtimes, so the ecosystem segment is the **language** and the platform is
compatibility / `runtime`-scope — never `jvm` or `dotnet` as the ecosystem.

### Why not `@scope/name` like npm?

We considered npm-style scopes (`@skillex/nextjs`, `@user/nextjs-strict`).
Rejected for two reasons:

- Skillex packs are not npm packages. Reusing npm syntax invites confusion
  (people will try `npm install @skillex/nextjs`).
- Dotted names sort and filter cleanly (`skillex packs available
  --ecosystem=javascript`): the ecosystem is always the second segment, so a
  filter can parse it without reading metadata, regardless of owner.

The npm scope `@atheory-ai/skillex-packs` is the *repo*; the contents are
addressed by dotted name.

### Handle ownership & verification

The first segment is always a **GitHub login — user or org**. The two
share one global namespace on GitHub, so a handle is unambiguous either
way and needs no separate rule. A handle is `<descriptor>`-friendly to
parse because GitHub logins may contain hyphens (`acme-labs`) but never
dots, while dot is our segment separator.

**Ownership is verified against GitHub, our existing trust root** (see
`03-security.md`). On every PR, CI checks that the pack's `handle` is
either the PR author's own login, or an org the PR author is a verified
member of. This is free precisely because the registry already lives on
GitHub — no separate identity system, no domain-ownership step like
Maven's reverse-DNS. Every owner gets a collision-proof namespace.

**Reserved handles.** A small list is reserved and cannot be claimed by
arbitrary contributors: `atheory-ai` (canonical), plus confusables and
generics we don't want squatted — `core`, `community`, `official`,
`verified`, `skillex`, `std`, `lang`. `atheory-ai.*` is publishable only
by the `@atheory-ai/skillex-maintainers` team; CI rejects any other
claimant. Handle segments are also run through the homoglyph check in
`03-security.md` so `vercel` cannot be impersonated by a look-alike.

### Tiers are derived from the handle

There is no `tier` in the name. The engine computes a trust tier from the
handle and shows it everywhere a pack is listed (`04-canonical-vs-community.md`):

| Handle | Derived tier |
|---|---|
| `atheory-ai` | **core** (canonical, atheory-ai-maintained) |
| a verified upstream org adopted as official (e.g. `vercel`, `prisma`) | **official** |
| any other verified user/org | **community** |

The "official" tier is granted explicitly (an atheory-ai decision
recorded in the manifest), not merely by being a verified org — being
verified only proves you *own* the handle, not that the pack is endorsed.

Examples:

- `vercel.javascript.metaframework.nextjs` — official, published by the Vercel org
- `alice.javascript.metaframework.nextjs` — Alice's community Next.js flavor
- `alice.javascript.metaframework.nextjs.strict` — her stricter variant
- `acme-labs.javascript.tool.eslint.standard` — the Acme Labs org's community pack

## Directory layout

Packs are grouped by **owner handle**, mirroring the name:

```
ecosystems/
  javascript/                               # the language, not the runtime
    package.json                            # npm workspace (tooling choice)
    packs/
      atheory-ai/                           # canonical owner
        lang.javascript/
          pack.yaml
          skills/*.md
          tests/*.test.md
        lang.typescript/
        runtime.bun/                        # runtime-specific idioms
        metaframework.nextjs/               # runtime-agnostic
        tool.eslint/
      vercel/                               # official (verified org)
        metaframework.nextjs/
      alice/                                # community
        metaframework.nextjs.strict/
  go/
    go.mod                                  # Go module
    packs/
      atheory-ai/
        lang.go/
        framework.gin/
  python/
    pyproject.toml                          # uv / hatch project
    packs/
      atheory-ai/
  java/                                     # language; JVM is a runtime
  kotlin/
  ruby/
  rust/
  csharp/                                   # language; .NET/CLR is a runtime
  polyglot/                                 # cross-ecosystem (docker, k8s, …)
    packs/
      atheory-ai/
        tool.docker/
        tool.kubernetes/
```

Notes:

- Each `ecosystems/<eco>/` is a **workspace** in the top-level monorepo.
  For JavaScript this means an npm workspace; for Go a separate module; for
  Python a uv project. This is a *tooling* choice for validating packs and
  is independent of the runtime a pack's subject targets. The monorepo
  top-level only needs Node tooling (we use skillex itself from Node).
- The path is `ecosystems/<ecosystem>/packs/<handle>/<scope>.<name>[.<descriptor>]/`,
  which maps directly to the pack name. So
  `ecosystems/javascript/packs/atheory-ai/metaframework.nextjs/` is the source
  for `atheory-ai.javascript.metaframework.nextjs`, and
  `ecosystems/javascript/packs/alice/metaframework.nextjs.strict/` is the source
  for `alice.javascript.metaframework.nextjs.strict`.
- Grouping by handle makes CODEOWNERS routing trivial: `packs/atheory-ai/**`
  routes to maintainers, and each other handle's directory routes to that
  handle's `OWNERS` (see `03-security.md`, `04-canonical-vs-community.md`).

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

`pack.yaml` has two parts: the **engine fields** (the manifest the engine
parses — the source of truth is `internal/packs/pack.go` in
`atheory-ai/skillex`) and a **`registry:` block** of metadata the engine
ignores but this registry uses to build the signed manifest.

```yaml
# --- engine fields (consumed by @atheory-ai/skillex) ---
name: atheory-ai.javascript.metaframework.nextjs
version: 1.4.0
description: Next.js App Router patterns and gotchas

# Detectors a pack defines (a MAP of name -> match rules). The engine's
# built-ins are only docker / go / javascript / typescript, so a pack
# declares anything else (like nextjs) itself.
detectors:
  nextjs:
    matches:
      - file: { path: "next.config.*" }
      - dependency: { source: npm-package, name: next }

skills:
  - file: skills/routing.md
    activate-when:            # >=1 of: files-present, files-matching,
      detector: nextjs        #         dependency-declared, detector
    scope: subtree            # repo|subtree|directory|matching-files|
  - file: skills/server-actions.md   #     nearest-ancestor|boundary
    activate-when:
      detector: nextjs
      files-matching: ["**/actions.{ts,js}"]
    scope: matching-files
    files: ["**/actions.{ts,js}"]

# --- registry-only metadata (ignored by the engine) ---
registry:
  license: Apache-2.0
  authors: [atheory-ai]
  homepage: https://github.com/atheory-ai/skillex-packs
  compatibility:              # forward-looking; see 02-versioning.md
    nextjs: ">=14 <16"
    node: ">=20"
```

> **Engine vs registry, deliberately separated.** The engine activates packs
> via `detectors` + per-skill `activate-when`/`scope`; it has no
> `compatibility`, tiers, or signing. Those live in the `registry:` block (and
> the signed manifest) as the registry's forward-looking layer — the engine
> ignores unknown top-level keys, so `pack.yaml` stays a valid engine manifest.

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

## Resolved

- **No short aliases.** Names are always the full
  `<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]`. A short form like
  `atheory-ai.nextjs` is ambiguous (whose `nextjs`? which ecosystem?),
  collision-prone, and would break the ecosystem-position parse that
  discovery relies on (ecosystem is always segment 2). Humans get
  discoverability from the browsable index and `skillex packs available`
  filters (`05-distribution.md`), not from guessable short names.

- **Naming scheme: handle-first, tier derived.** The first segment is the
  owner's verified GitHub handle (user or org); `atheory-ai` is the
  canonical owner. There is no `tier` segment — trust tier (core /
  official / community) is derived from the handle and shown by the
  engine. This unifies canonical and community under one model, lets
  upstreams publish official packs under their own brand
  (`vercel.javascript.metaframework.nextjs`), and keeps ecosystem-position
  discovery (`--ecosystem=javascript` parses segment 2 regardless of owner).
  Ownership is verified against GitHub in CI — free because the registry
  already lives there, no Maven-style domain dance. See "Handle ownership
  & verification" and "Tiers are derived from the handle".
- **Ecosystem segment is the language, not the runtime.** The second
  segment is the language / package ecosystem (`javascript`, `python`,
  `go`, …), spelled out in full. A framework that runs on multiple runtimes
  (Next.js on Node/Bun/Deno) is named once under its language; runtimes are
  expressed via `compatibility:` and optional `runtime`-scope packs. This
  also fixes the `node`/`java`/`dotnet` inconsistency (those were runtimes/
  platforms): JVM and .NET/CLR become runtimes too, with the language as
  the ecosystem. See "Ecosystem is the language, not the runtime".
