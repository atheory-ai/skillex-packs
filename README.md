# skillex-packs

A **securely published registry of skillex packs** — distributable bundles of
*skills* (focused, versioned documentation) that AI agents install to gain
ecosystem-specific knowledge: Next.js App Router conventions, ESLint rule
rationale, Go module idioms, and so on.

This repo is maintained by **atheory-ai** as the home of the **canonical**
packs, and it doubles as a reusable, open template: the same build, signing,
and review machinery can be **forked to run your own registry** with an
identical security posture.

> **Engine:** [`@atheory-ai/skillex`](https://github.com/atheory-ai/skillex) —
> the CLI / MCP server that detects a project's stack, resolves applicable
> packs from a registry, verifies them, and surfaces their skills to agents.

The authoritative design lives in [`.specs/`](.specs/README.md); this README
is the orientation.

---

## What is a pack?

A **skill** is a Markdown file with YAML frontmatter — one focused topic an
agent can load on demand (e.g. "Next.js server actions: when and why"). A
**pack** is a versioned collection of related skills plus the metadata that
says *when it applies* and *what it's compatible with*.

A pack is **data, not code.** Packs contain only `.md`, `.yaml`, `.yml`,
`.json`, `.txt` — there are no install hooks and nothing is ever `exec`'d. The
trust surface is "an agent reads this text as guidance," which is exactly what
the security posture below is built to protect.

A pack directory:

```
<scope>.<name>[.<descriptor>]/
  pack.yaml        # manifest: name, version, compatibility, activation, skills
  README.md        # human description (shown in the registry index)
  OWNERS           # GitHub handles responsible for maintenance/review
  CHANGELOG.md
  skills/*.md      # the skills (YAML frontmatter + Markdown)
  tests/*.test.md  # lightweight presence/quality checks
```

---

## Security posture

The registry's whole value is that an agent can trust what it installs. Every
layer is designed so that **a tampered or impersonated pack is rejected**, and
so that trust does **not** depend on GitHub, a CDN, or any single channel
being uncompromised. (Full threat model: [`.specs/03-security.md`](.specs/03-security.md).)

- **Built only in CI, from reviewed source.** In v1 contributors submit pack
  *source* via pull request; CI builds every tarball deterministically. There
  are no externally-produced binaries to trust.
- **Content-addressed + signed.** Every tarball's SHA256 is pinned in the
  registry **manifest**, which is **cosign-signed** (keyless OIDC) and carries
  **SLSA build provenance**. The engine refuses any tarball whose hash doesn't
  match — nothing lands on disk on a mismatch.
- **Out-of-band trust root.** The engine ships the *expected signer identity*
  (the GitHub Actions OIDC issuer + the release workflows) and the sigstore
  trusted root **inside the engine package** — a different channel from the
  registry it verifies. A registry/CDN compromise can't declare itself a valid
  signer, and verification works offline.
- **Verified identity for every owner.** Pack names are *handle-first*; the
  handle is a **GitHub user/org verified in CI** (you can only publish under a
  handle you own). Reserved handles and a homoglyph check prevent
  impersonation.
- **Reviewed, signature-guarded publishing.** The manifest is a
  version-controlled, **cosign-bundle-signed** file on `main`, updated only via
  a **reviewed PR**. A CI **tamper-guard** re-verifies the committed manifest's
  signature on every PR, so a hand-edited manifest can't even be merged — in
  addition to the engine's per-fetch verification.
- **No arbitrary code, ever.** A strict file allowlist is enforced at PR-time
  *and* at install-time extraction (which also refuses symlinks and absolute
  paths).
- **Provenance of contributions.** Commits require a DCO sign-off
  (`Signed-off-by`) and cryptographic signatures; `main` is protected
  (required PR + checks + signed commits, no bot bypass).
- **Revocation.** A signed `registry/revocations.json` lets the engine refuse
  a withdrawn pack version before installing or refreshing.

---

## Naming & organization

Packs are named **handle-first**, and the path mirrors the name:

```
<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]
```

```
ecosystems/
  <ecosystem>/                 # the LANGUAGE/package ecosystem, not the runtime
    packs/
      <handle>/                # owner: a verified GitHub user/org
        <scope>.<name>[.<descriptor>]/
```

- **handle** — the owner's verified GitHub login. `atheory-ai` is the
  canonical owner. *There is no `tier` segment* — trust tier is **derived**
  from the handle (below).
- **ecosystem** — the **language**, not the runtime: `javascript`, `python`,
  `go`, `rust`, … Next.js runs on Node/Bun/Deno, so it lives once under
  `javascript`; runtimes are expressed via `compatibility:` and `runtime`-scope
  packs.
- **scope** — `lang` · `runtime` · `framework` · `metaframework` · `tool` ·
  `library` · `pattern`.

Example: `ecosystems/javascript/packs/atheory-ai/metaframework.nextjs/` is the
source for `atheory-ai.javascript.metaframework.nextjs`. Full rationale:
[`.specs/01-naming-and-structure.md`](.specs/01-naming-and-structure.md).

### Trust tiers (derived from the handle)

| Tier | Handle | Meaning |
|---|---|---|
| **core** | `atheory-ai` | Canonical, atheory-ai-maintained, highest review bar |
| **official** | a verified upstream org granted official status (e.g. `vercel`) | First-party for its own technology |
| **community** | any other verified user/org | Lower-trust, lower-friction |

The engine always displays the tier so users and agents know how much to lean
on a pack. See [`.specs/04-canonical-vs-community.md`](.specs/04-canonical-vs-community.md).

### Repository layout

```
.specs/         Design docs (start at .specs/README.md)
ecosystems/     Packs, grouped by ecosystem then owner handle
registry/       The signed manifest (registry/manifest.json + .bundle)
scripts/        Build/validate/sign tooling (lint-pack, build-manifest, …)
skills/         Skills ABOUT working in this repo (the contributor lifecycle)
test/           Tests for the tooling
.github/        CI: validate, dco, release-pack, release-manifest + governance
```

---

## Contributing a pack

Anyone can contribute — under **your own verified handle** (community), an
upstream org granted *official* status, or `atheory-ai` (core). Every
contribution is open-source into this repo under Apache-2.0 with a **DCO
sign-off** (you keep your copyright; no CLA) and passes the CI gates (lint,
schema, file-allowlist, prompt-injection checks, tests).

The step-by-step — authoring, naming, versioning, the commit/sign-off
workflow, review, and release — lives in **[`CONTRIBUTING.md`](CONTRIBUTING.md)**
(see also [`DCO`](DCO) and [`SECURITY.md`](SECURITY.md)). Because this repo
runs skillex on itself, the same lifecycle is also queryable as skills in
[`skills/`](skills/) — e.g. `skillex query --search "authoring a pack"`.

Publishing is tag-triggered: a `pack/<name>/v<semver>` tag builds, signs, and
SLSA-attests the release, then a reviewed PR updates the signed manifest
([`.specs/05-distribution.md`](.specs/05-distribution.md)).

---

## Using packs with skillex (consumer side)

In a project that has the engine installed:

```bash
skillex packs available      # detect the stack; list matching packs + tiers
skillex packs install <name> # consent → fetch → verify signature + SHA → extract
skillex packs list           # what's installed
skillex packs update         # re-resolve against a fresh, verified manifest
```

The engine verifies the manifest's signature against its bundled trust root,
then each tarball's SHA against the signed manifest, before anything is
written. Agents reach the same flow through the MCP tools
(`list_available_packs`, `propose_pack_install` with a diff preview).

---

## Fork it: run your own registry

This repo is a template for a **secure registry of your own** — internal
company packs, a niche ecosystem, anything. The engine never hard-codes this
repo; `skillex.json` takes an **ordered list of registries** with precedence
and policy. To stand one up:

1. **Fork** and keep the `scripts/` + `.github/` machinery (build, lint, sign,
   manifest, tamper-guard).
2. **Re-sign under your own identity** — CI signs with *your* GitHub Actions
   OIDC identity; consumers pin *that* identity.
3. **Configure consumers** in `skillex.json`:

   ```jsonc
   {
     "registries": [
       { "name": "corp", "url": "https://packs.corp.example/manifest.json",
         "trustedRoot": "./corp-cosign-root.json" },
       { "name": "upstream", "url": "https://packs.skillex.dev/manifest.json",
         "trustedRoot": "bundled",
         "allow": { "tiers": ["core", "official"] } }   // e.g. no community from upstream
     ],
     "policy": { "tiers": ["core", "official", "community"],
                 "licenses": { "deny": ["GPL-3.0-only"] } }
   }
   ```

The crucial safety property: **precedence picks *which* registry to fetch
from; the handle picks *who must have signed*.** A registry can mirror & shadow
another's packs but can never forge a handle whose signing root it doesn't
hold (mirror-yes, forge-no). Full design — including policy filtering and the
future first-party (atheory-ai Studio) publishing path — is in
[`.specs/06-registries-and-federation.md`](.specs/06-registries-and-federation.md).

---

## Local development

```bash
npm install          # pins @atheory-ai/skillex + tooling deps
npm run lint:packs   # security/content/naming gate
npm run build:manifest  # build the manifest from packs (structure check)
npm test             # tooling tests (node:test)
npm run validate     # validate the repo's own skill test files
```

---

## Status

The design (`.specs/`) is complete and the **build → sign → attest → manifest
→ publish** pipeline is live and proven end to end, with a first signed
manifest and an example pack release in place. Canonical seed packs are next,
pending `pack.yaml` schema alignment with the engine. Roadmap:
[`.specs/00-overview.md`](.specs/00-overview.md).

## License

[Apache-2.0](LICENSE) (`NOTICE`). Contributions are inbound under Apache-2.0
with a DCO sign-off; contributors retain copyright. A pack may declare its own
OSI license (Apache-2.0 / MIT / BSD; GPL allowed but flagged) for downstream
consumers.
