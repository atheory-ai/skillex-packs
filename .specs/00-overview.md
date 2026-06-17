# 00 — Overview

## Goal

Build a **trustworthy, discoverable, multi-ecosystem registry** of skillex
packs so that:

1. When a user runs `skillex refresh` in a Go / Node / Python / … project,
   skillex can list applicable packs ("I detected Next.js 14 and Prisma — these
   3 packs match"), prompt for consent, and install them.
2. atheory-ai can ship **canonical** packs for major ecosystems with a clear
   review bar.
3. The community can contribute **flavored** packs (different opinions,
   stricter rules, niche frameworks) without lowering trust on the canonical
   set.
4. Pack distribution is resistant to supply-chain attacks at every step
   (authoring, building, signing, hosting, install, refresh).

## Non-goals (for v1)

- Hosting **private** packs. v1 is public-only. Private/corp registries are
  a follow-on once the public mechanics are stable — but the *mechanism*
  for them (plural `registries[]` config, precedence, policy filtering,
  handle→root trust binding) ships in v1 so nothing has to be re-architected
  later. See `06-registries-and-federation.md`.
- Running **arbitrary code** inside packs. A pack is markdown + YAML + JSON.
  We never `eval`, `exec`, or load native plugins from a pack. The trust
  surface is "the agent reads this text"; that already needs a prompt-
  injection story (see `03-security.md`), but it's much smaller than running
  a postinstall script.
- Replacing language-native skill mechanisms (Cursor rules, Continue prompts,
  etc.) — skillex packs sit alongside them.

## Roadmap

| Phase | Deliverable | Gate |
|---|---|---|
| **P0 — Spec freeze** | These docs reach consensus. Pack manifest schema (`pack.yaml` v1) is locked. | Spec PR review by atheory-ai |
| **P1 — Engine read path** | Engine repo: `skillex packs available / install / list / remove` commands; manifest fetch + verify; consent prompt; uninstall path; plural `registries[]` config with precedence + policy filtering + handle→root trust binding (`06-registries-and-federation.md`). | Acceptance fixtures in engine repo |
| **P2 — Registry plumbing** | This repo: validate / build / sign / publish scripts; CI that produces a signed manifest on every tag; discovery surfaces (canonical signed Release + `packs.skillex.dev` Worker + GitHub Pages index — no raw `main` copy; see `05-distribution.md`). | First test release `v0.0.1` with one toy pack |
| **P3 — Canonical seed** | Ship 3–5 canonical packs: `javascript-core`, `nextjs`, `eslint`, `go-core`, `python-core`. | Each pack has skills, tests, owners |
| **P4 — Community lane** | Contribution template, per-handle CODEOWNERS, DCO sign-off enforcement, security review checklist, automated PR linting. | First merged community pack |
| **P5 — MCP UX** | Agent-facing tools: `list_available_packs`, `propose_pack_install` with diff preview. | Demo in claude / cursor |

P1 and P2 can land in parallel — they're decoupled by the manifest schema.

## Out-of-scope discussions (parking lot)

- Telemetry / analytics on pack usage — privacy-sensitive, defer.
- Paid / proprietary packs — defer until public model is proven.
- Cross-pack dependencies — packs can reference each other by name but
  installation is independent; we will not build a transitive resolver in v1.
- Mirroring to additional registries (Anthropic skill registry, etc.) —
  out of scope until we have something worth mirroring.

## Resolved

- **SLSA L2 provenance ships at launch.** Since every tarball is built in
  our own CI pipeline (no externally-produced artifacts in v1), generating
  provenance via `slsa-github-generator` is nearly free — there is no
  reason to defer it. Launch with cosign-signed manifests **and** a
  per-release SLSA L2 attestation; the engine verifies provenance in
  addition to the manifest signature. L3 (hermetic builder) stays a later
  upgrade. See `03-security.md`, "SLSA / provenance".
- **Naming: handle-first, tier derived.** Pack names are
  `<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]`, where `handle` is a
  verified GitHub user/org and `atheory-ai` is the canonical owner. There
  is no tier segment — the engine derives the tier (core / official /
  community) from the handle and always displays it. This lets upstreams
  publish official packs under their own brand
  (`vercel.javascript.metaframework.nextjs`) and keeps ecosystem-position
  discovery. See `01-naming-and-structure.md` and
  `04-canonical-vs-community.md`.
- **Hosting / source-of-truth for community packs.** v1 has a single
  model: contributors submit pack **source** via PR to this repo, and our
  CI builds, hashes, signs, and SLSA-attests every tarball — core and
  community alike. No external repos or externally-produced tarballs in
  v1; community review happens in the PR, behind a mandatory automated +
  human review gate (per version). Externally-originated packs are
  deferred to a future **atheory-ai Studio** trusted-publisher path.
  Consumers get durability by vendoring `.skillex/packs/` into their own
  git. See `04-canonical-vs-community.md` and `05-distribution.md`.
