# skillex-packs

Official registry of **skillex packs** — distributable bundles of skills that
agents can install to gain ecosystem-specific knowledge (Next.js conventions,
Go module idioms, Rails patterns, ESLint rule rationale, and so on).

This repository is the **canonical / core** pack registry maintained by
atheory-ai. It is also the staging ground for the manifest and distribution
mechanics that any third-party / community registry can reuse.

> Engine: [`@atheory-ai/skillex`](https://github.com/atheory-ai/skillex) — the
> CLI / MCP server that detects projects, resolves applicable packs, and
> surfaces skills to agents.

## What's in here

```
.specs/             Design notes for layout, security, versioning, distribution
ecosystems/         One workspace per language ecosystem (node, go, python, …)
  <eco>/packs/core/<framework>/      Canonical packs (atheory-ai-authored)
  <eco>/packs/community/<scope>/<n>/ Optional community-maintained packs
registry/           Built manifest + checksums consumed by the skillex CLI
scripts/            Build / validate / sign / publish tooling
skills/             Skills *about authoring packs* — used by agents working in
                    this repo, not distributed
AGENTS.md           Auto-generated entry point for agents working in this repo
```

A pack is a directory containing:

- `pack.yaml` — manifest (name, version, scopes, activation, compatibility)
- `*.md` — the skill files themselves
- `tests/` — optional `.test.md` files that validate skill behavior

See `.specs/01-naming-and-structure.md` for the full layout rationale.

## Status

Early — the design is being captured under `.specs/`. No packs are published
yet. See [`.specs/00-overview.md`](.specs/00-overview.md) for the roadmap.

## Local setup

```bash
npm install            # installs @atheory-ai/skillex (used to lint/build packs)
npx skillex doctor     # sanity-check the working tree
npx skillex refresh    # rebuild the local registry index
```

## Contributing

- **Core packs** require review by `@atheory-ai/skillex-maintainers`.
- **Community packs** are accepted under `ecosystems/<eco>/packs/community/`
  with a lighter review bar — see `.specs/04-canonical-vs-community.md`.
- All packs must pass `npm run validate` (manifest schema + skill structure +
  test scaffolding) before merge.

## License

Apache 2.0. Each community pack may carry its own SPDX header but must be
license-compatible with Apache 2.0 distribution.
