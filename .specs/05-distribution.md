# 05 — Distribution

## Where packs live in transit

| Asset | Hosted on | URL pattern |
|---|---|---|
| Pack tarball | GitHub Release of this repo | `github.com/atheory-ai/skillex-packs/releases/download/pack/<name>/v<ver>/<name>-<ver>.tar.gz` |
| Tarball checksum | Same release | `…/<name>-<ver>.tar.gz.sha256` |
| Registry manifest | GitHub Release `manifest/v<n>` **or** `raw.githubusercontent.com/atheory-ai/skillex-packs/main/registry/manifest.json` | both |
| Manifest signature bundle | Same place as manifest | `manifest.json.sig`, `manifest.json.cert` |
| SLSA attestation | Same release | `<name>-<ver>.intoto.jsonl` |

We deliberately stay on GitHub. Reasons in `00-overview.md` and prior
discussion: free, CDN-fronted, anonymous reads, integrated with the
release workflow, easy provenance story. We can put Cloudflare in front
later if traffic justifies.

## Tag scheme

We don't release the whole repo as one unit — that would force every
pack to share a version. Instead, **each pack release is its own tag**:

```
pack/<full-pack-name>/v<semver>
```

Examples:

```
pack/atheory-ai.javascript.metaframework.nextjs/v2.4.0
pack/atheory-ai.go.framework.gin/v0.3.1
pack/alice.javascript.tool.eslint.airbnb/v3.0.1
```

CI workflow `release-pack.yml` triggers on these tags:

1. Validates the pack at the tag (schema, lint, tests).
2. Builds a deterministic tarball (sorted entries, mtime=0).
3. Generates SHA256.
4. Signs with cosign keyless OIDC.
5. Uploads tarball + checksum + signature + SLSA attestation to a
   GitHub Release named after the tag.
6. Updates `registry/manifest.json` via a follow-up commit to `main`
   (or to a release branch then PR), then triggers `release-manifest.yml`.

Manifest releases use:

```
manifest/v<n>             # n is monotonic, incremented per publish
```

## Registry manifest

`registry/manifest.json` is the **single source of truth** for what's
installable. Engine fetches it (default: from the latest
`manifest/v<n>` release; cached locally), verifies its signature, then
intersects against the local project.

Schema sketch (locked in v1 — see open questions):

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-06-15T17:00:00Z",
  "expiresAt": "2026-07-15T17:00:00Z",        // advisory default; real threshold is per-client in skillex.json (see 03-security.md)
  "registry": "atheory-ai/skillex-packs",
  "packs": [
    {
      "name": "atheory-ai.javascript.metaframework.nextjs",
      "handle": "atheory-ai",
      "tier": "core",                            // derived from handle; engine displays it
      "version": "2.4.0",
      "description": "Next.js App Router patterns and gotchas",
      "homepage": "https://github.com/atheory-ai/skillex-packs/tree/main/ecosystems/javascript/packs/atheory-ai/metaframework.nextjs",
      "license": "Apache-2.0",
      "authors": ["atheory-ai"],
      "compatibility": {
        "nextjs": ">=14 <16",
        "node": ">=20",
        "skillex": ">=0.7 <2"
      },
      "tarball": {
        "url": "https://github.com/atheory-ai/skillex-packs/releases/download/pack/atheory-ai.javascript.metaframework.nextjs/v2.4.0/atheory-ai.javascript.metaframework.nextjs-2.4.0.tar.gz",
        "sha256": "9f86d…",
        "size": 18242
      },
      "attestation": {
        "url": "https://github.com/atheory-ai/skillex-packs/releases/download/pack/atheory-ai.javascript.metaframework.nextjs/v2.4.0/atheory-ai.javascript.metaframework.nextjs-2.4.0.intoto.jsonl"
      }
    }
    /* … other entries … */
  ],
  "revocations": [
    { "name": "atheory-ai.javascript.tool.eslint", "version": "1.4.0", "reason": "prompt-injection in skills/rules.md", "revokedAt": "2026-06-10T…" }
  ]
}
```

We keep **all currently supported versions** of every pack in the
manifest, not just the latest, so the engine can resolve to the right
major (see `02-versioning.md`).

Entries may also carry optional `replaces` / `superseded-by` fields that
mirror a pack's rename chain (e.g. a community pack promoted to core under
the `atheory-ai` handle). The engine follows them on `update`/`install` so
renames migrate cleanly — see `02-versioning.md`, "Renames & supersession".
Pre-release versions are listed too but only resolve under
`--include-prerelease`.

## Engine integration

New engine commands (proposed for skillex `0.8.0`):

```
skillex packs available            # list manifest entries matching local project
skillex packs install <name>       # consent → fetch → verify → extract
skillex packs list                 # what's installed locally
skillex packs remove <name>
skillex packs update [<name>]      # re-resolve against fresh manifest
skillex packs trust <key-or-issuer>  # advanced: pin a different signing identity
```

MCP tools (for agent-driven flows):

- `list_available_packs(filter?)` — read-only, returns matching manifest
  entries with tier label.
- `propose_pack_install(name)` — returns a diff (skill names, scopes,
  activation rules) for the user to confirm. **Never installs without
  confirmation.**

On disk after install:

```
.skillex/
  packs/
    atheory-ai.javascript.metaframework.nextjs/
      manifest.lock.json            # pinned version + sha256 we trusted
      …extracted pack contents…
  index.db
```

`manifest.lock.json` is what makes installs reproducible: the engine
records exactly which manifest entry it installed from, including the
sha256 it verified. A re-install or a `skillex doctor` run validates
the on-disk pack against this lock.

### Vendoring (local cache in project git)

Because the lock pins the verified sha256, a project can **commit
`.skillex/packs/` into its own git** as a durable local cache — the same
pattern as vendoring `node_modules` or Go modules. This gives
reproducible and air-gappable installs, and insulates a project from a
registry outage or a withdrawn version, without weakening security:
`skillex doctor` re-validates the vendored bytes against
`manifest.lock.json`, so a tampered vendored copy is detected just like a
tampered download. See `04-canonical-vs-community.md`, "Durability
(consumer-side)".

## Install / refresh UX (CLI)

```
$ skillex packs available
Detecting environment…
  ecosystem: javascript
  runtime:   node 20.11
  next.js:   14.2.6
  eslint:    9.5.0
  prisma:    5.18.0

3 packs available for this project:

  [core]      atheory-ai.javascript.metaframework.nextjs    2.4.0
  [core]      atheory-ai.javascript.tool.eslint             1.6.2
  [official]  vercel.javascript.metaframework.nextjs        3.1.0
  [community] alice.javascript.lang.typescript.strict       0.4.0

Install all core packs? [y/N/select] _
```

Agent flow is the same but mediated through the MCP server.

## Air-gapped / private use

The whole chain is designed so that an organization can:

1. Mirror this repo internally.
2. Re-run the release workflow against their own cosign identity.
3. Pin engine clients to their internal manifest URL.

Nothing in the engine should hard-code `atheory-ai/skillex-packs`; the
registry endpoint is configurable in `skillex.json`. That config is an
**ordered list** of registries, not a single URL — an internal mirror can be
listed ahead of (or instead of) the public one, with policy filtering and
handle→root trust binding. See `06-registries-and-federation.md`.

## Discovery surfaces

The manifest is reachable four ways, each with a defined role. All serve
the *same* signed `manifest.json`; only the path differs. All four ship in
v1.

| Surface | URL | Role | Trust |
|---|---|---|---|
| **GitHub Release** `manifest/v<n>` | `…/releases/download/manifest/v<n>/manifest.json` (+ `.sig`, `.cert`) | **Canonical** — what the engine verifies and installs from | Immutable per `v<n>`, signed |
| **Raw on `main`** | `raw.githubusercontent.com/atheory-ai/skillex-packs/main/registry/manifest.json` | Fast-discovery fallback / "what's newest" | Advisory — signed but mutable; re-verified before trust |
| **Discovery endpoint** | `https://packs.skillex.dev/manifest.json` (Cloudflare Worker) | Memorable, stable URL for humans / integrations; proxies the canonical Release | Advisory — verified like any fetch |
| **Browsable index** | GitHub Pages site on this repo | Human-facing: search/filter packs by ecosystem, tier, owner | Informational only; not an install source |

What keeps this safe regardless of surface:

- **Signature verification is per-fetch, not per-source.** Whatever URL the
  bytes came from, the engine verifies the cosign signature against the
  identity bundled in the engine (`03-security.md`) before trusting
  anything. "Advisory" only means we don't *promise* immutability there —
  it cannot downgrade integrity, because a missing/mismatched signature is
  rejected wherever the bytes originated.
- **The engine defaults to the Release** for installs and may use the raw /
  worker URLs for discovery speed; all are overridable via the configurable
  registry endpoint in `skillex.json` (see Air-gapped / private use).
- The Pages site and the Worker are **conveniences**, never the root of
  trust — both are rebuildable from the repo at any time. The Worker adds
  one domain (`packs.skillex.dev`) to maintain; accepted as the cost of a
  memorable, CDN-fronted discovery URL.
