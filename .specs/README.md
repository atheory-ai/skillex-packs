# Specs

Design notes for the skillex-packs registry. These are **planning documents**,
not contracts — they are expected to evolve as the engine matures. When a spec
solidifies enough to govern behavior, lift the stable parts into
`docs/` (user-facing) or into the engine repo's spec.

## Reading order

1. **[00-overview.md](00-overview.md)** — goals, scope, non-goals, roadmap
2. **[01-naming-and-structure.md](01-naming-and-structure.md)** — directory
   layout, naming conventions, monorepo workspaces, scoping
3. **[02-versioning.md](02-versioning.md)** — pack semver, compatibility
   metadata, resolving the right pack version for a detected environment
4. **[03-security.md](03-security.md)** — threat model and supply-chain
   defenses (signing, attestations, pinning, prompt-injection surface)
5. **[04-canonical-vs-community.md](04-canonical-vs-community.md)** —
   trust tiers, review process, naming separation, contribution flow
6. **[05-distribution.md](05-distribution.md)** — registry manifest,
   hosting, install UX, CLI / MCP integration

Each spec ends with an **Open questions** section. Resolve those before
implementing, not during.
