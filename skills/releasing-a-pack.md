---
name: Releasing a Pack
description: How publishing works — the per-pack release tag scheme, the release workflow (deterministic tarball, SHA256, cosign signing, SLSA provenance), the signed manifest, and the discovery surfaces a published pack appears on. Use when cutting a release.
topics: [releasing, distribution]
tags: [contributor-guide, maintainer-guide]
---

# Releasing a Pack

Source of truth: `.specs/05-distribution.md` and `.specs/03-security.md`.

## Merging is not publishing

A merge to `main` updates source only. **Publishing is triggered by a
release tag:**

```
pack/<full-pack-name>/v<semver>
```

Examples:

```
pack/atheory-ai.javascript.metaframework.nextjs/v2.4.0
pack/alice.javascript.tool.eslint.airbnb/v3.0.1
```

Tags matching `pack/atheory-ai.*` are protected — only the release workflow
creates them, via a deploy environment with a manual approval gate.

## What the release workflow does

On a `pack/<name>/v<ver>` tag, `release-pack.yml`:

1. Validates the pack at the tag (schema, lint, tests).
2. Builds a **deterministic** tarball (sorted entries, `mtime=0`).
3. Generates a SHA256.
4. Signs with **cosign** keyless OIDC.
5. Emits a **SLSA L2** provenance attestation (`.intoto.jsonl`).
6. Uploads tarball + `.sha256` + signature + attestation to a GitHub
   Release named after the tag.
7. Updates `registry/manifest.json` and triggers `release-manifest.yml`,
   which signs the manifest (cosign) and publishes a `manifest/v<n>`.

Because **we build every tarball in-pipeline**, every entry carries our
cosign signature *and* SLSA provenance — uniformly, core and community
alike. There is no externally-produced artifact in v1.

## The signed manifest is the source of truth

`registry/manifest.json` lists every supported version of every pack with:
`name`, `handle`, derived `tier`, `version`, `compatibility`, the
`tarball` `{url, sha256, size}`, and `attestation`. It carries
`generatedAt` and an advisory `expiresAt`. Optional `replaces` /
`superseded-by` mirror a pack's rename chain
(`skills/versioning-a-pack.md`).

The engine verifies the manifest's signature against the identity bundled
in the engine (not fetched from the registry), then refuses any tarball
whose SHA256 doesn't match — no files land on disk on mismatch.

## Where a published pack shows up (discovery surfaces)

All serve the same signed manifest; only the path differs:

- **GitHub Release `manifest/v<n>`** — canonical; what the engine verifies
  and installs from.
- **Raw on `main`** — advisory fast-discovery fallback.
- **`packs.skillex.dev/manifest.json`** — memorable Worker endpoint.
- **GitHub Pages index** — human-browsable; not an install source.

Verification is per-fetch regardless of surface, so the advisory ones can't
weaken integrity.

## Revoking a bad release

A withdrawn version goes in `registry/revocations.json` (also signed); the
engine checks revocations before install/refresh. See
`skills/security-and-review.md`.
