# 03 — Security & Supply Chain

This is the most important spec in the repo. A skillex pack is **text that
an agent reads as authoritative guidance**. Compromising a pack means
compromising every agent that has it installed. The threat surface is
narrower than executing code, but it is **not zero** — see Threat Model
below.

## Threat model

| Threat | Realistic? | Mitigation |
|---|---|---|
| **Attacker pushes malicious commit to this repo** | Yes — any contributor with bypass-able rules | Branch protection, required reviews, signed commits, no force-push to `main`, CODEOWNERS for `core/**` |
| **Attacker compromises a maintainer's GitHub account** | Yes — phishing, token leak | Required 2FA on the org, short-lived OIDC tokens for CI, hardware key for release signing |
| **Attacker tampers with built artifacts in transit (registry → user)** | Yes — DNS, MITM, GitHub release upload race | All artifacts SHA256-pinned in a **signed** manifest; engine verifies signature before consuming |
| **Attacker substitutes a pack tarball after publish** | Yes — registry compromise, CDN poisoning | Manifest pins SHA256 per tarball; engine refuses on mismatch |
| **Attacker registers a typosquat in `community.*`** | Yes — `core.node.lang.javascripr` | Reserved prefix check; trust-tier UI; auto-detect homoglyphs on PR; require human review for new top-level community names |
| **Pack content contains a prompt-injection payload** | Yes — community lane is the path | Mandatory schema validation; "show me what changes" diff preview on install; agent-side hardening guidelines published alongside the registry |
| **Pack adds an `activates-when` rule that silently matches everything** | Yes — accident more often than malice | Activation rules validated; warn on over-broad globs in CI; engine reports activated files at install time so user sees scope |
| **Stale dependency in a tool we ship for validation** | Yes | Renovate / dependabot on devDependencies; `npm audit --omit=dev=false` in CI |
| **Postinstall script smuggled into a pack** | **No — by design.** Packs are markdown + YAML + JSON. There is no install hook. The engine never `exec`s pack content. | Engine enforces: any file extension outside the allowlist (`.md`, `.yaml`, `.yml`, `.json`, `.txt`) is rejected at install time |

## Non-threat: arbitrary code execution

Packs do not, and will not, contain executable code that runs on the user's
machine. The engine ships exactly two execution surfaces:

1. **Skill content reaches the agent.** Prompt injection risk — see below.
2. **Activation rules** (globs, detector matches). These are pure
   data, evaluated by the engine.

If we ever add executable content (custom validators, generators), it must
be a separate concept with a separate trust tier and explicit consent.

## Signing & integrity

Two layers:

1. **Per-tarball SHA256.** Every pack release produces a `.tar.gz` plus a
   `.sha256`. Both are uploaded to the GitHub Release.
2. **Signed manifest.** The registry manifest (`registry/manifest.json`)
   is signed with [cosign](https://docs.sigstore.dev/cosign/overview/)
   keyless OIDC signing inside the release workflow. The signature
   bundle (`manifest.json.sig`, `manifest.json.cert`) is published
   alongside.

Engine install path:

```
fetch manifest.json + signature bundle
  └─ verify cosign signature against the expected issuer
     (https://token.actions.githubusercontent.com → atheory-ai/skillex-packs)
     and the expected workflow path (.github/workflows/release.yml@refs/tags/*)
  └─ for each pack the user wants:
       fetch tarball
       verify SHA256 against manifest entry
       extract under .skillex/packs/<name>@<version>/
       enforce file allowlist during extraction
       refuse symlinks and absolute paths in archive
```

If any step fails, **no files land on disk**.

## SLSA / provenance

Day 1 target: **SLSA Build Level 2** via `slsa-github-generator`. Each
release produces a provenance attestation pinned to the workflow that
built it. The engine can opt-in to verify the attestation in addition to
the cosign signature.

We can extend to Level 3 once we have a hermetic builder; not blocking
for launch.

## Branch protection & repo policy

Mandatory on this repo from day one:

- `main` requires PRs, 1 required review (2 for `core/**` via CODEOWNERS),
  passing CI, signed commits.
- No force-push to `main` or to `pack/*` release tags.
- Tags matching `pack/core.*` are protected — only the release workflow
  can create them, via a deploy environment with a manual approval gate.
- All maintainers in the `@atheory-ai/skillex-maintainers` team must have
  2FA enforced at the org level.
- Org secrets used by CI (npm token for any sibling publish, cosign
  credentials) are short-lived OIDC, not static PATs.

## Prompt-injection hardening

The community lane is where prompt-injection content can sneak in. We
mitigate at three layers:

1. **PR-time linting.** A `scripts/lint-pack.mjs` runs on every PR:
   - Forbid raw HTML, especially `<script>`, `<iframe>`, hidden text,
     U+200B / U+2060 / U+FEFF zero-widths, RTL/LTR overrides,
     homoglyph-rich identifiers.
   - Require every link to use plain `https://` (no IDN encoding).
   - Flag suspicious phrases used as prompt-injection priming
     ("ignore previous instructions", "system:", "<|assistant|>", …).
     These are advisory — they fail the build only when above a noise
     threshold, but get a review reviewer attached.
2. **Diff preview on install.** When a user runs
   `skillex packs install <name>`, the engine shows the skills that will
   land and asks for confirmation. For interactive agents we expose this
   diff via the MCP tool so the agent can show the user.
3. **Documented guardrails for agent integrators.** A short doc
   (`docs/agent-integration.md`, future) tells SDK builders: pack content
   should be presented to the model with the **same trust tier** as
   READMEs the agent reads off disk, no higher. In particular, an agent
   should not let a skill alter its system prompt or escalate tool
   permissions.

## Vulnerability response

- `SECURITY.md` at repo root with private reporting via GitHub Security
  Advisories.
- A revocation entry in `registry/revocations.json` (also signed) lists
  any pack version withdrawn for security reasons. Engine checks
  revocations before installing or refreshing.
- Time-to-mitigation goal: < 24h for critical (publicly exploitable
  prompt-injection), < 7d for high.

## Open questions

- Do we want to require a **two-of-N** signing model for `core.*` releases
  (i.e. cosign signatures from two distinct maintainers)? Adds friction;
  worth it if we ever ship core packs that gate sensitive workflows.
- Should the manifest carry a **freshness window** (e.g. "valid for 30
  days from `generatedAt`") so the engine can warn on stale local cache?
  Yes for v1 but enforcement is advisory only — we don't want offline
  installs to break.
- Should we publish the cosign verification key out-of-band (e.g. in
  `@atheory-ai/skillex` engine itself) so install can be done in pure
  air-gapped mode against a vendored manifest? Probably yes; cheap to do.
