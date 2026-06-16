---
name: Security and the Review Gate
description: The supply-chain and prompt-injection threat model, the mandatory automated + human review gate, the file allowlist, what the linter rejects, handle-ownership and reserved-handle enforcement, signing/provenance, and revocations. Use when reviewing a pack PR or understanding why a check failed.
topics: [security, packs]
tags: [maintainer-guide, security]
---

# Security and the Review Gate

Source of truth: `.specs/03-security.md` (the most important spec) and the
review gate in `.specs/04-canonical-vs-community.md`.

## The core threat: a pack is text an agent trusts

A pack is markdown + YAML + JSON that an agent reads as authoritative
guidance. There is **no code execution** — no install hooks, no `eval`, no
native plugins. The engine ships exactly two surfaces: skill content
reaching the agent (prompt-injection risk) and activation rules (pure
data). The narrower-but-nonzero risk is prompt injection in content.

## The mandatory review gate (per version)

Nothing is merged — and therefore no tarball is built, hashed, or added to
the manifest — until it passes **both**:

1. **Automated review** — `scripts/lint-pack.mjs` + schema validation + the
   file-extension allowlist + prompt-injection checks, in CI on the PR.
2. **Human review** — the tier's required approvals (1 for a new community
   pack, 2 for `packs/atheory-ai/**` via CODEOWNERS).

Every new version is a new PR re-cleared through the same gate.

## File allowlist

Only `.md`, `.yaml`, `.yml`, `.json`, `.txt` are allowed in a pack. Anything
else is rejected at PR lint and again at install-time extraction (which also
refuses symlinks and absolute paths in the archive).

## What the linter rejects

- Files outside the allowlist.
- Hidden / zero-width / RTL-override characters (U+200B, U+2060, U+FEFF,
  bidi overrides) and homoglyph-rich identifiers.
- Raw HTML in skill content (especially `<script>`, `<iframe>`, hidden
  text).
- IDN-encoded / non-plain-`https://` links.
- Prompt-injection priming phrases ("ignore previous instructions",
  "system:", "<|assistant|>", …) above a noise threshold — these attach a
  reviewer.
- A reserved-handle claim (`atheory-ai`, `core`, `official`, …) or a handle
  not owned by the PR author; handle homoglyph collisions.
- Over-broad `activates-when` globs (warned), so a pack can't silently
  match everything.

When authoring, the cardinal rule: **write factual, audience-neutral docs;
never address the agent** ("as an AI you should…"). See
`skills/authoring-a-pack.md`.

## Integrity & provenance (how trust reaches the user)

- Every tarball has a SHA256 pinned in the **signed** manifest; the engine
  refuses on mismatch — nothing lands on disk.
- The manifest is cosign-signed; the verification identity + sigstore
  trusted root are **bundled in the engine** (out-of-band), so a registry
  compromise can't declare itself the signer, and verification works
  offline. v1 uses a single signer (no two-of-N).
- SLSA L2 provenance ships per release and is verifiable alongside the
  signature.
- Trust binds to the **handle**: `atheory-ai.*` must verify against the
  bundled atheory-ai root no matter which registry served it (mirror-yes,
  forge-no) — see `skills/registries-and-federation.md`.

## Revocations & response

A withdrawn version is listed in `registry/revocations.json` (also signed);
the engine checks it before install/refresh. Targets: critical
(publicly-exploitable prompt-injection) mitigated < 24h, high < 7d. Private
reporting via GitHub Security Advisories.
