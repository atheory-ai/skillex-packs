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
pack/core.node.metaframework.nextjs/v2.4.0
pack/core.go.framework.gin/v0.3.1
pack/community.node.tool.eslint.airbnb-strict/v3.0.1
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
  "expiresAt": "2026-07-15T17:00:00Z",        // freshness window, advisory
  "registry": "atheory-ai/skillex-packs",
  "packs": [
    {
      "name": "core.node.metaframework.nextjs",
      "tier": "core",
      "version": "2.4.0",
      "description": "Next.js App Router patterns and gotchas",
      "homepage": "https://github.com/atheory-ai/skillex-packs/tree/main/ecosystems/node/packs/core/metaframework.nextjs",
      "license": "Apache-2.0",
      "authors": ["atheory-ai"],
      "compatibility": {
        "nextjs": ">=14 <16",
        "node": ">=20",
        "skillex": ">=0.7 <2"
      },
      "tarball": {
        "url": "https://github.com/atheory-ai/skillex-packs/releases/download/pack/core.node.metaframework.nextjs/v2.4.0/core.node.metaframework.nextjs-2.4.0.tar.gz",
        "sha256": "9f86d…",
        "size": 18242
      },
      "attestation": {
        "url": "https://github.com/atheory-ai/skillex-packs/releases/download/pack/core.node.metaframework.nextjs/v2.4.0/core.node.metaframework.nextjs-2.4.0.intoto.jsonl"
      }
    }
    /* … other entries … */
  ],
  "revocations": [
    { "name": "core.node.tool.eslint", "version": "1.4.0", "reason": "prompt-injection in skills/rules.md", "revokedAt": "2026-06-10T…" }
  ]
}
```

We keep **all currently supported versions** of every pack in the
manifest, not just the latest, so the engine can resolve to the right
major (see `02-versioning.md`).

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
    core.node.metaframework.nextjs/
      manifest.lock.json            # pinned version + sha256 we trusted
      …extracted pack contents…
  index.db
```

`manifest.lock.json` is what makes installs reproducible: the engine
records exactly which manifest entry it installed from, including the
sha256 it verified. A re-install or a `skillex doctor` run validates
the on-disk pack against this lock.

## Install / refresh UX (CLI)

```
$ skillex packs available
Detecting environment…
  ecosystem: node
  next.js:   14.2.6
  eslint:    9.5.0
  prisma:    5.18.0

3 packs available for this project:

  [core]      core.node.metaframework.nextjs   2.4.0
  [core]      core.node.tool.eslint            1.6.2
  [community] community.node.lang.typescript.strict  0.4.0

Install all core packs? [y/N/select] _
```

Agent flow is the same but mediated through the MCP server.

## Air-gapped / private use

The whole chain is designed so that an organization can:

1. Mirror this repo internally.
2. Re-run the release workflow against their own cosign identity.
3. Pin engine clients to their internal manifest URL.

Nothing in the engine should hard-code `atheory-ai/skillex-packs`; the
registry endpoint is configurable in `skillex.json`.

## Open questions

- Manifest hosting: do we serve from
  `raw.githubusercontent.com/.../main/registry/manifest.json` (always
  current, no release ceremony) or **only** from the `manifest/v<n>`
  GitHub Release tag (immutable, signed, requires CI to update)?
  Suggested: **both**, with the raw URL marked advisory and the Release
  URL canonical. Engine prefers the Release for verification; the raw
  URL is the fast-discovery fallback.
- Should we ship a small static site (GitHub Pages on this repo) that
  renders the manifest as a browsable index? Low effort, high
  discoverability win. Defer to P3+.
- Do we want a JSON-RPC / HTTP discovery endpoint hosted on workers
  (`packs.skillex.dev/manifest.json`)? Easier to memorize than a
  raw.githubusercontent URL, but adds a domain to maintain. Defer.
