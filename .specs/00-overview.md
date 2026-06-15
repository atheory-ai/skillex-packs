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

- Hosting **private** packs. v1 is public-only. Private registries are a
  follow-on once the public mechanics are stable.
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
| **P1 — Engine read path** | Engine repo: `skillex packs available / install / list / remove` commands; manifest fetch + verify; consent prompt; uninstall path. | Acceptance fixtures in engine repo |
| **P2 — Registry plumbing** | This repo: validate / build / sign / publish scripts; CI that produces a signed manifest on every tag. | First test release `v0.0.1` with one toy pack |
| **P3 — Canonical seed** | Ship 3–5 canonical packs: `node-core`, `nextjs`, `eslint`, `go-core`, `python-core`. | Each pack has skills, tests, owners |
| **P4 — Community lane** | Contribution template, CODEOWNERS for `community/`, security review checklist, automated PR linting. | First merged community pack |
| **P5 — MCP UX** | Agent-facing tools: `list_available_packs`, `propose_pack_install` with diff preview. | Demo in claude / cursor |

P1 and P2 can land in parallel — they're decoupled by the manifest schema.

## Out-of-scope discussions (parking lot)

- Telemetry / analytics on pack usage — privacy-sensitive, defer.
- Paid / proprietary packs — defer until public model is proven.
- Cross-pack dependencies — packs can reference each other by name but
  installation is independent; we will not build a transitive resolver in v1.
- Mirroring to additional registries (Anthropic skill registry, etc.) —
  out of scope until we have something worth mirroring.

## Open questions

- Should the registry repo also be the **source-of-truth git host** for
  community packs, or should community packs live in their own repos and
  this repo merely **lists** them? (See `04-canonical-vs-community.md`.)
- Do we need a **provenance attestation** (SLSA L2+) at launch, or can we
  start with cosign-signed manifests and add SLSA later?
