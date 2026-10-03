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
7. Triggers `release-manifest.yml`, which builds from immutable releases,
   signs the manifest, and proposes the manifest plus bundle as a reviewed PR
   to `main`. Merging that PR publishes the updated installable catalog.

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

- **Signed manifest and bundle on `main`** — canonical; what the engine
  verifies before installing. Raw GitHub URLs transport that pair.
- **`packs.skillex.dev/manifest.json`** — memorable Worker endpoint.
- **GitHub Pages index** — human-browsable; not an install source.

Verification is per-fetch regardless of surface, so the advisory ones can't
weaken integrity.

## Revoking a bad release

The signed manifest's `revocations[]` records withdrawn versions. The initial
consumer fetches a fresh manifest before install. Offline refresh authenticates
cached evidence and checks its embedded revocations; it cannot discover later
withdrawals. See `.specs/03-security.md`.

## Correct a published schema mismatch

Changing source does not repair an immutable archive. The example 0.1.0 was
signed with the old manifest schema, so prepare 0.1.1 with current per-skill
activation and registry metadata, publish through the protected workflow, and
review its signed manifest update. Consumers must refuse invalid schemas even
when their signatures and checksums verify. Do not overwrite old assets or
hand-edit signed registry bytes.
