# 04 — Canonical (Core) vs Community Packs

## Why two tiers

A single trust tier forces an unwinnable choice:

- If the bar is *low*, the canonical Next.js pack and a community
  experimental pack are presented identically to the agent and the user.
  That's bad for trust and for canonical maintainers' reputation.
- If the bar is *high*, community contributors give up and the registry
  stays small.

Two tiers — `core` and `community` — let us hold a high bar on the
canonical packs while keeping a healthy, lower-friction community lane.

## Core packs

- Name prefix: `core.*` (reserved; engine rejects non-canonical claimants).
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

Promotion is an atheory-ai decision documented in a PR that moves the
pack from `community/` to `core/` and updates the manifest's `tier:`.

## Community packs

- Name prefix: `community.*`. Any non-`core.*` name is treated as
  community.
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

- Name uses `community.<ecosystem>.<scope>.<name>[.<flavor>]` and does
  not collide with an existing pack.
- Name does not visually collide with `core.*` packs (homoglyph check
  in CI).
- `pack.yaml` validates against the schema.
- `compatibility` ranges are non-empty and credible.
- `OWNERS` lists at least one GitHub handle willing to maintain.
- License is Apache-2.0 / MIT / BSD-style. GPL is fine but flagged in
  the manifest so consumers know.
- Linter passes (`scripts/lint-pack.mjs`).
- No `core.*` claim, no impersonation of a canonical author handle.

### Community pack hosting

Two viable models. **Pick one in v1; defer the other.**

| Model | How it works | Pros | Cons |
|---|---|---|---|
| **Monorepo inclusion** (default) | Community packs live under `ecosystems/*/packs/community/`, the same release pipeline produces tarballs for them. | One CI, one signing pipeline, one manifest. Best supply-chain story. | atheory-ai infra is the bottleneck. Authors give up direct release control. |
| **External repo + index** | Community pack lives in the author's own repo; this repo lists it in `registry/community-index.yaml` after vetting. Engine resolves the tarball URL from the index. | Authors own their release cadence. | Signing chain is harder — we can't sign someone else's tarball. Have to either sign their *URL pin* in our manifest (TOFU on first publish) or require them to publish via a constrained workflow we trust. |

**Recommendation: start with monorepo inclusion.** It is strictly stronger
on security and makes the launch story simple. External repos can come
later as a graduation path.

## What about flavors / forks?

A community pack can fork a canonical pack to express stronger opinions:

- `core.node.tool.eslint` — canonical, broad rule rationale
- `community.node.tool.eslint.airbnb-strict` — community, applies the
  Airbnb-strict rule set
- `community.node.tool.eslint.standard` — community, Standard style

Forks are encouraged: they reduce pressure on the canonical pack to be
all things to all teams. The canonical pack's job is to be a
**reasonable default**; flavor packs encode strong opinions.

When skillex detects ESLint, both the canonical and any matching flavor
packs are surfaced — the user picks.

## Trust signals visible to users / agents

The engine should make tier obvious every time a pack is mentioned:

```
$ skillex packs available
  core      core.node.metaframework.nextjs        2.4.0   atheory-ai
  community community.node.metaframework.nextjs.strict 1.2.0   alice
  community community.node.tool.eslint.airbnb-strict   3.0.1   bob
```

In MCP responses, the same tier label is in the tool output, never
hidden. Agents should be told (via docs, not via skill content) to treat
`community` packs as **lower-trust** sources of guidance.

## Open questions

- Should we publish a **deprecation policy** for community packs whose
  owners stop responding to security issues? Suggested rule: 30 days
  silent → atheory-ai can take over OWNERS or remove the pack with
  notice in the manifest.
- Should we have a third tier for **verified-third-party** (e.g.
  framework maintainers publishing their own packs)? Nice but not v1.
