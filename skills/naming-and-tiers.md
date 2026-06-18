---
name: Naming and Trust Tiers
description: The handle-first pack naming scheme, why the ecosystem segment is the language (not the runtime), reserved handles and GitHub-verified ownership, and how the core/official/community trust tier is derived from the handle. Use when naming a pack or deciding its tier.
topics: [naming, tiers]
tags: [contributor-guide]
---

# Naming and Trust Tiers

Source of truth: `.specs/01-naming-and-structure.md` and
`.specs/04-canonical-vs-community.md`. This skill is the working summary.

## The scheme

```
<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]
```

| Segment | Meaning | Examples |
|---|---|---|
| `handle` | owner's **verified GitHub login** (user or org); `atheory-ai` is canonical | `atheory-ai`, `vercel`, `alice`, `acme-labs` |
| `ecosystem` | the **language / package ecosystem**, *not* the runtime | `javascript`, `python`, `go`, `rust`, `ruby`, `java` |
| `scope` | what kind of thing it's about | `lang`, `runtime`, `framework`, `metaframework`, `tool`, `library`, `pattern` |
| `name` | the thing | `nextjs`, `eslint`, `gin`, `prisma` |
| `descriptor` | optional leaf for sibling packs from the same owner | `strict`, `minimal`, `airbnb` |

There is **no tier segment.**

## Ecosystem is the language, not the runtime

Next.js runs on Node, Bun, Deno, and edge runtimes, so it is named **once**:
`*.javascript.metaframework.nextjs`. Don't encode the runtime in the name.

Runtimes are modelled two ways instead:

- **`registry.compatibility:`** — `{ node: ">=20", bun: ">=1.1" }`
  (registry-layer metadata; see `skills/versioning-a-pack.md`).
- **`runtime`-scope packs** for runtime-specific idioms —
  `atheory-ai.javascript.runtime.bun`.

The same rule covers multi-language platforms: the JVM (`java`, `kotlin`,
`scala`) and .NET/CLR (`csharp`, `fsharp`) are runtimes — the ecosystem
segment is always the *language*.

## Handle ownership & verification

The handle is a GitHub login (user and org share one namespace, so it's
unambiguous). CI verifies, on every PR, that the handle is either the PR
author's login or an org they're a verified member of. This is free because
the registry already lives on GitHub — no CLA portal, no domain dance.

**Reserved handles** can't be claimed by arbitrary contributors:
`atheory-ai`, `core`, `community`, `official`, `verified`, `skillex`,
`std`, `lang`. `atheory-ai.*` is publishable only by
`@atheory-ai/skillex-maintainers`. Handles also pass a homoglyph check so
`vercel` can't be impersonated.

## Tiers are derived, never declared

The engine computes the trust tier from the handle and shows it everywhere
a pack is listed:

| Handle | Derived tier |
|---|---|
| `atheory-ai` | **core** — canonical, highest bar |
| a verified upstream org granted official status (`vercel`, `prisma`) | **official** — first-party for its own tech |
| any other verified user/org | **community** — lower-trust, lower-friction |

"official" is granted explicitly by atheory-ai and recorded in the
manifest. Being a verified org only proves you *own* the handle — it does
not by itself make a pack official.

## Flavors / forks

Forking a canonical pack to express stronger opinions is encouraged — it
keeps the canonical pack a reasonable default:

- `atheory-ai.javascript.tool.eslint` — canonical, broad rationale
- `alice.javascript.tool.eslint.airbnb` — community, Airbnb rule set
- `bob.javascript.tool.eslint.standard` — community, Standard style

When skillex detects ESLint it surfaces the canonical and any matching
flavors; the user picks.

## No short aliases

Always use the full name. Short forms like `atheory-ai.nextjs` are
ambiguous and collision-prone, and break the ecosystem-position parse that
`--ecosystem=...` relies on. Discoverability comes from the browsable index
and `skillex packs available` filters, not guessable names.
