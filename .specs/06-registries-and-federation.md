# 06 — Registries & Federation

## Why this exists

A single public registry (`atheory-ai/skillex-packs`) is the v1 default, but
the engine must never *assume* it is the only one. Real consumers want to:

- run their **own** registry of internal packs;
- still pull `core` and `official` from atheory-ai, but **not** `community`;
- **vet-then-mirror** upstream packs into an internal source they control;
- exclude whole categories (a license they can't ship, an entire tier).

This is the same need `.npmrc` (scoped registries), `GOPROXY` (a fallback
chain), and apt (sources + pinning) all serve. The skillex model below adds
one thing those mostly lack: trust is bound to the pack's **handle**, not to
the registry that served it — which is what makes federation safe.

## Configuration model

`skillex.json` carries an **ordered list** of registries plus a global
policy. Order is precedence — first match wins, like `GOPROXY`'s chain.

```jsonc
{
  "registries": [                                   // order = precedence
    { "name": "corp",
      "url": "https://packs.corp.example/manifest.json",
      "trustedRoot": "./corp-cosign-root.json" },   // corp's own signing identity
    { "name": "upstream",
      "url": "https://packs.skillex.dev/manifest.json",
      "trustedRoot": "bundled",                      // atheory-ai, shipped in the engine
      "allow": { "tiers": ["core", "official"] } }   // take ONLY core+official here
  ],
  "policy": {                                         // global filters (AND-ed with per-registry)
    "tiers": ["core", "official", "community"],       // drop a tier by omitting it
    "licenses": { "deny": ["GPL-3.0-only"] },         // SPDX ids
    "excludeScopes": [],                              // e.g. ["pattern"] to drop pattern packs
    "excludeEcosystems": []
  }
}
```

The list is plural **from v1**, even when it holds a single entry, so adding
registries later is config, not a schema migration.

## Resolution: precedence

To resolve a pack name for a detected project:

1. Walk `registries` in order.
2. At each registry, apply that registry's `allow`/`deny` **and** the global
   `policy` (both must permit — AND semantics). If the pack/tier/license is
   filtered out here, skip to the next registry.
3. The first registry that offers a version satisfying the project's
   `compatibility` (the algorithm in `02-versioning.md`) **wins**. Resolve
   the version *within* that registry — we do **not** merge versions of one
   name across registries (that would make "which bytes did I get?"
   ambiguous).
4. If no registry yields a permitted, compatible version, surface a
   "no source" diagnostic naming what was filtered and where.

**Shadowing / pinning.** Because precedence is explicit, a higher-precedence
registry can *shadow* a name — serve its own vetted copy of
`vercel.javascript.metaframework.nextjs` ahead of upstream. This is the
vet-then-mirror pattern enterprises rely on. Safety for shadowing is covered
next.

## Policy & filtering

Filters are declarative and compose (per-registry `allow`/`deny` intersected
with global `policy`):

- **`tiers`** — `core` / `official` / `community`. Tiers are *derived from
  the handle* (`04-canonical-vs-community.md`), so "core + official but not
  community" is just `["core", "official"]`. This is the headline request.
- **`licenses`** — allow/deny by SPDX id (e.g. deny `GPL-3.0-only`).
- **`excludeScopes` / `excludeEcosystems`** — drop categories wholesale.

A filtered pack is treated as "not offered by this registry," so resolution
falls through to the next registry rather than failing outright.

## Trust in a federated world (the crux)

Precedence decides **which registry to fetch from**. It must **not** decide
**who is allowed to have signed**. If it did, a higher-precedence (or
compromised) registry could serve a *forged* `atheory-ai.*` pack signed by
its own root.

The binding rule:

> The signer identity required for a pack is determined by its **handle**,
> not by the registry that served it.

- `atheory-ai.*` must verify against the **bundled** atheory-ai root
  (`03-security.md`, out-of-band trusted root) — no matter which registry the
  bytes came from.
- Other handles verify against the root declared for the registry that owns
  them (or an explicit handle→root mapping in config).
- A pack whose signature does not chain to its handle's required root is
  **rejected with a security warning**, and resolution continues down the
  precedence chain. A forged identity can therefore never be *accepted*, and
  a misbehaving high-precedence registry cannot block a name that a
  lower-precedence registry serves correctly.

Consequences, which are exactly what we want:

- A corp registry **can mirror & shadow** upstream packs at higher
  precedence — it serves the genuine atheory-ai-signed bytes, faster and
  internally. **Mirror: yes.**
- A corp registry **cannot forge** `atheory-ai.*` (or any handle whose root
  it doesn't hold), because it can't produce a chaining signature.
  **Forge: no.**
- Corp's own `corp.*` packs verify against corp's configured root.

In one line: **precedence picks the source; the handle picks the required
signer.** This is the federated generalization of the single-registry,
engine-bundled-root decision in `03-security.md`.

## Phasing

| Capability | Phase |
|---|---|
| Plural `registries[]` config schema (often one entry) | **v1** |
| Precedence resolution (first permitted, compatible match wins) | **v1** |
| Global + per-registry policy filtering (tiers, licenses, scopes) | **v1** |
| Handle→root trust binding (mirror-yes / forge-no) | **v1** |
| Mirroring atheory-ai into a self-hosted, re-signed alternate | **v1** (see `05-distribution.md`, air-gapped) |
| **Private / corp registries** (auth, private packs) | **post-v1** (`00-overview.md` non-goal) |
| **Upstream-hosted official registries** ("just core from atheory-ai, officials from the source", e.g. `packs.vercel.dev`) | **post-v1** — ties to atheory-ai Studio (`04-canonical-vs-community.md`) |

The point of shipping the schema, precedence, policy, and trust binding in
v1 — even while the only production registry is atheory-ai's public one — is
that **none of the post-v1 work requires changing config shape or the trust
model**. Federation becomes adding entries, not re-architecting.

## Open questions

- Do we want a `GONOSUMDB`-style escape hatch to *relax* handle→root binding
  for a named prefix in trusted internal environments? Powerful but
  foot-gun; default off; defer until a concrete enterprise asks.
