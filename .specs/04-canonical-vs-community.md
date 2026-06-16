# 04 — Trust Tiers: Core, Official, Community

## Tiers are derived from the handle

There is **no tier segment in a pack name** (`01-naming-and-structure.md`).
The engine derives a tier from the owner handle and its verification
status, and shows that tier everywhere a pack is listed. Three tiers:

| Tier | Handle | Maintained by | Trust |
|---|---|---|---|
| **core** | `atheory-ai` (reserved) | atheory-ai maintainers + per-pack OWNERS | canonical, highest bar |
| **official** | a verified upstream org explicitly blessed (e.g. `vercel`, `prisma`) | that org | first-party for its own technology |
| **community** | any other verified user/org | the handle's OWNERS | lower-trust, lower-friction |

Why tiers at all: a single bar is an unwinnable choice — set it low and
canonical packs look no different from experiments (bad for trust and for
maintainer reputation); set it high and community contributors give up
(registry stays small). Deriving the tier from a **verified** handle lets
us hold a high bar on `atheory-ai.*`, recognize genuine upstreams as
`official`, and keep a healthy community lane — all without a tier keyword
in the name, and all rooted in GitHub identity we already verify.

## Core packs (`atheory-ai.*`)

- Handle: `atheory-ai` — reserved; only `@atheory-ai/skillex-maintainers`
  may publish under it, and CI rejects any other claimant.
- Maintained by `@atheory-ai/skillex-maintainers` plus per-pack OWNERS.
- Review: **2 approvals** required for any change, one of whom must be a
  pack OWNER. CI must be green. Signed commits required.
- Style guide: opinionated, but the goal is to capture **broadly accepted**
  conventions of the underlying ecosystem (the React docs' recommendations,
  the Next.js team's "App Router defaults", the Go team's effective Go
  guidance). When there's genuine community disagreement, the canonical
  pack picks one path and a community flavor pack can offer the other.
- Lifecycle: long-lived. Deprecation requires a 90-day notice and a
  `replaces` / `superseded-by` chain in the manifest.

### Becoming a core pack

A community pack can be **promoted** to core if:

1. It has stable maintainers willing to take on OWNERS responsibility.
2. It has at least 6 months of active maintenance with no security or
   quality regressions.
3. There's no existing canonical pack covering the same scope (or the
   existing canonical pack is being retired).

Promotion is an atheory-ai decision: atheory-ai takes over OWNERS and the
pack is **republished under the `atheory-ai.*` handle**. Because the
handle is the first name segment, the name changes (`alice.javascript.…` →
`atheory-ai.javascript.…`), so the manifest records a `replaces` /
`superseded-by` link from the old community name and installs migrate
cleanly (see `02-versioning.md`). The derived tier flips from community to
core automatically with the handle — there is no separate `tier:` field to
flip.

## Official packs (verified upstreams)

An upstream maintainer can publish first-party packs under **their own
verified org handle** — `vercel.javascript.metaframework.nextjs`,
`prisma.javascript.tool.prisma`. Mechanically these are just verified-handle
packs; the **official** label is granted explicitly by atheory-ai and
recorded in the manifest. Being a verified org only proves you *own* the
handle — it does not by itself endorse the pack as official, so the label
is a deliberate atheory-ai decision, not an automatic consequence of
verification. Until granted, such a pack is shown as community.

## Community packs

- Handle: any verified GitHub user/org that is neither `atheory-ai` (core)
  nor an org blessed as official. The tier is **derived, not declared**.
- Maintained by the contributor(s) listed in pack `OWNERS`. atheory-ai
  is **not** on the hook for community pack correctness.
- Review: **1 approval** from atheory-ai for **new** community packs
  (anti-typosquat / anti-spam / anti-prompt-injection gate). After
  acceptance, the pack's own OWNERS can self-approve subsequent changes,
  with a CODEOWNERS rule routing to them. atheory-ai retains a veto for
  security violations.
- Style guide: anything goes within the rules below.

### Community pack acceptance criteria

A community pack PR passes review when:

- Name uses `<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]` and does
  not collide with an existing pack.
- The `handle` is **owned by the PR author** — their GitHub login, or an
  org they are a verified member of (checked in CI).
- The `handle` is not a reserved handle (`atheory-ai`, `core`, `official`,
  …) and does not visually collide with another handle (homoglyph check
  in CI).
- `pack.yaml` validates against the schema.
- `compatibility` ranges are non-empty and credible.
- `OWNERS` lists at least one GitHub handle willing to maintain.
- License is Apache-2.0 / MIT / BSD-style. GPL is fine but flagged in
  the manifest so consumers know.
- Linter passes (`scripts/lint-pack.mjs`).

### Community pack hosting

**v1 model: source lives in this repo; we build every tarball.**
Contributors submit pack **source** (markdown + YAML + JSON) via pull
request under `ecosystems/*/packs/<handle>/`. There are **no external
repos and no externally-produced tarballs** in v1. The community
reviews PRs in the open; atheory-ai applies the new-pack gate
(`1 approval` per the acceptance criteria above). CI then builds the
tarball deterministically, hashes it, signs the manifest, and emits SLSA
provenance — uniformly for every pack, core and community alike.

This is deliberately the simplest and strongest supply-chain story:

- **One build pipeline.** Because *we* build every tar, every manifest
  entry carries our cosign signature **and** our SLSA provenance. There
  is no "we can't sign someone else's artifact" problem and no optional
  attestation — see `03-security.md` and `05-distribution.md`.
- **Review is the PR.** A reviewer reads the actual source that will be
  built, not an opaque tarball. The hash pin in the manifest then binds
  the engine to exactly the bytes CI produced from that reviewed source.
- **No availability caveat.** We host the only copy of record, so there
  is no upstream-unpublish risk to reason about.

### Mandatory review gate

No pack source is merged — and therefore no tarball is built, hashed, or
referenced in `registry/manifest.json` — until it has passed:

1. **Automated review** — `scripts/lint-pack.mjs` plus schema validation,
   the file-extension allowlist, and the prompt-injection checks from
   `03-security.md`, run in CI on the PR.
2. **Human review** — the approvals required by tier (1 for a new
   community pack, 2 for `packs/atheory-ai/**` via CODEOWNERS).

Because every version ships as its own build and hash
(`05-distribution.md`, tag scheme), this gate runs **per version**: a new
release is a new PR, re-cleared through the same checks. There is no path
by which content reaches the engine without passing the gate.

### Future: atheory-ai Studio as a trusted publisher

Externally-originated packs are a **post-v1** concern, and the intended
path is not "host a URL we hash" but **atheory-ai Studio**: a first-party
service that builds, signs, and publishes tarballs through a pipeline we
control and trust. When we later accept Studio-published packs, we are
trusting *Studio's* build-and-sign identity — a natural fit for the
**official** tier, where a verified upstream publishes under its own
handle — rather than taking on review-and-hash of arbitrary remote
tarballs. Until Studio exists, the v1 PR model above is the only way a
pack enters the registry.

### Durability (consumer-side)

Independently of the above, a project can **commit its installed packs
into its own git** as a local cache (`.skillex/packs/`), the way teams
vendor `node_modules` or Go modules. Each install writes a
`manifest.lock.json` pinning the SHA256 the engine verified
(`05-distribution.md`, "Engine integration"), so a vendored copy is
self-verifying — `skillex doctor` re-checks the on-disk bytes against the
lock. This gives reproducible, air-gappable installs without weakening
the trust chain: the hash still gates what is trusted.

## Contribution terms & licensing

Community packs are **open-source contributions into this monorepo**, not
externally-owned property we merely host. That distinction settles
who-can-do-what:

- **Contributors keep copyright.** They license their contribution under
  the repo's OSI license (Apache-2.0); there is no copyright assignment.
- **Inbound is explicit via DCO.** Every commit carries a Developer
  Certificate of Origin `Signed-off-by` line, attesting the contributor
  has the right to submit it under that license. CI enforces the sign-off.
  We use DCO rather than a CLA to keep contribution friction low — no
  signing portal, no assignment.
- **A pack may declare its own license** (`pack.yaml`; Apache-2.0 / MIT /
  BSD, GPL allowed but flagged) for downstream consumers, but inbound to
  the repo the contribution is governed by the repo license + DCO.
- **`OWNERS` is maintenance, not a property right.** It routes review and
  names who maintains the pack; it does not place the pack beyond repo
  stewardship.

Because the source lives in our repo under these terms, atheory-ai retains
the inherent right to fix a security issue, re-route `OWNERS`, or withdraw
a pack — no separate "ownership transfer" mechanism is needed (see
Resolved).

## What about flavors / forks?

A community pack can fork a canonical pack to express stronger opinions:

- `atheory-ai.javascript.tool.eslint` — canonical, broad rule rationale
- `alice.javascript.tool.eslint.airbnb` — community, applies the Airbnb rule set
- `bob.javascript.tool.eslint.standard` — community, Standard style

Forks are encouraged: they reduce pressure on the canonical pack to be
all things to all teams. The canonical pack's job is to be a
**reasonable default**; flavor packs encode strong opinions.

When skillex detects ESLint, both the canonical and any matching flavor
packs are surfaced — the user picks.

## Trust signals visible to users / agents

The engine should make tier obvious every time a pack is mentioned:

```
$ skillex packs available
  core      atheory-ai.javascript.metaframework.nextjs    2.4.0   atheory-ai
  official  vercel.javascript.metaframework.nextjs        3.1.0   vercel
  community alice.javascript.metaframework.nextjs.strict  1.2.0   alice
  community bob.javascript.tool.eslint.airbnb             3.0.1   bob
```

Because the tier is **not** encoded in the name, rendering it is
load-bearing: the engine derives it from the handle and must show it every
time — in the CLI as above, and in MCP responses as a field in the tool
output, never hidden. Agents should be told (via docs, not via skill
content) to treat `community` packs as **lower-trust** sources of
guidance, `official` as first-party for its own technology, and `core` as
canonical.

## Resolved

- **No ownership-takeover policy for unresponsive owners.** Not needed.
  Community packs are open-source contributions into this repo under the
  repo license + DCO ("Contribution terms & licensing"), so `OWNERS` is
  maintenance routing, not property. If an owner goes silent on a
  **security** issue, atheory-ai patches the pack or revokes the affected
  version (`03-security.md`) under its standing security veto — no
  ownership transfer required. Plain abandonment with no security issue
  just leaves the pack to go stale; it can be marked unmaintained and
  garbage-collected later. No 30-day "takeover" ceremony.
- **Inbound contribution terms.** Repo OSI license (Apache-2.0) + DCO
  `Signed-off-by` per commit, enforced in CI; contributors keep copyright,
  no CLA. See "Contribution terms & licensing".
- **Verified-third-party tier.** Yes — it's the **official** tier above.
  Handle-first naming makes it natural: an upstream publishes under its own
  verified org handle (`vercel.*`), and atheory-ai grants the `official`
  label in the manifest. No separate naming mechanism needed.
