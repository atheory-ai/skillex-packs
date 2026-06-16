---
name: Registries and Federation
description: How skillex consumes one or many registries — the ordered registries[] config with precedence, per-registry and global policy filtering (tiers, licenses, scopes), and the handle->root trust binding that makes federation safe (mirror-yes, forge-no). Use when configuring registry sources or reasoning about multi-registry trust.
topics: [registries, distribution]
tags: [maintainer-guide]
---

# Registries and Federation

Source of truth: `.specs/06-registries-and-federation.md`. Design-forward
and phased: the schema, precedence, policy, and trust binding ship in v1;
private/corp registries and upstream-hosted official registries are
post-v1.

## One registry is the default, not an assumption

The engine never hard-codes `atheory-ai/skillex-packs`. `skillex.json`
carries an **ordered list** of registries — order is precedence, first
match wins (like `GOPROXY`).

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
  "policy": {                                         // global, AND-ed with per-registry
    "tiers": ["core", "official", "community"],
    "licenses": { "deny": ["GPL-3.0-only"] },
    "excludeScopes": []
  }
}
```

The list is plural even with one entry, so adding registries later is config
— not a migration.

## Resolution: precedence

Walk registries in order; at each, apply its `allow`/`deny` **and** the
global `policy` (both must permit). The first registry offering a version
that satisfies the project's `compatibility` wins, and the version is
resolved *within* that registry (versions of one name are not merged across
registries). A higher-precedence registry can **shadow** a name — serve its
own vetted copy of `vercel.javascript.metaframework.nextjs` ahead of
upstream (the vet-then-mirror pattern).

## Policy / filtering — the common requests

- **"core + official but not community"** → `allow.tiers: ["core",
  "official"]` (per registry) or `policy.tiers` (global). Tiers are derived
  from the handle (`skills/naming-and-tiers.md`), so this is trivial.
- **Deny a license** → `policy.licenses.deny: ["GPL-3.0-only"]`.
- **Drop categories** → `excludeScopes` / `excludeEcosystems`.

## The rule that makes federation safe

Precedence picks **which registry to fetch from**. It must not pick **who
may have signed**. Trust binds to the pack's **handle**:

> `atheory-ai.*` must verify against the **bundled** atheory-ai root no
> matter which registry served the bytes; other handles verify against the
> root configured for their registry. A signature that doesn't chain to the
> handle's required root is rejected (and resolution continues down the
> chain).

Consequences:

- A corp registry **can mirror & shadow** upstream packs (genuine
  atheory-ai-signed bytes, served internally/faster). **Mirror: yes.**
- It **cannot forge** `atheory-ai.*` — it can't produce a chaining
  signature. **Forge: no.**
- Corp's own `corp.*` packs verify against corp's configured root.

In one line: **precedence picks the source; the handle picks the required
signer.** This is the federated generalization of the engine-bundled-root
decision in `skills/security-and-review.md`.

## Phasing

- **v1:** plural `registries[]`, precedence, policy filtering, handle→root
  binding, and mirroring atheory-ai into a self-hosted re-signed alternate
  (air-gapped use).
- **post-v1:** private/corp registries (auth, private packs) and
  upstream-hosted official registries ("just core from atheory-ai,
  officials from `packs.vercel.dev`") — ties to atheory-ai Studio. Adding
  them is new config, not a re-architecture.
