# Tests: registries-and-federation.md

## Validation: core and official but not community

Prompt: A company wants atheory-ai's core and official packs but not community ones. How is that configured?
Success criteria:
  - Set `allow.tiers: ["core","official"]` on the upstream registry (or global `policy.tiers`).
  - Notes tiers are derived from the handle, so the filter is trivial.

## Validation: precedence

Prompt: If two registries both offer `vercel.javascript.metaframework.nextjs`, which wins?
Success criteria:
  - The higher-precedence (earlier-listed) registry; first match wins.
  - Versions of one name are not merged across registries.

## Validation: safe federation

Prompt: Can a higher-precedence corp registry shadow an atheory-ai pack with a forged version?
Success criteria:
  - It can mirror/shadow genuine signed bytes but cannot forge: `atheory-ai.*` must verify against the bundled atheory-ai root.
  - Precedence picks the source; the handle picks the required signer.
