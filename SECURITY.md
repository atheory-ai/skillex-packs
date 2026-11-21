# Security Policy

A skillex pack is **text an agent reads as authoritative guidance**, so the
integrity of this registry matters even though packs never execute code. The
full threat model and mitigations are in
[`.specs/03-security.md`](.specs/03-security.md).

## Reporting a vulnerability

**Do not open a public issue for a security problem.** Report privately via
GitHub Security Advisories:

> Repository → **Security** tab → **Report a vulnerability**

Include the pack name/version (or tooling area), what an attacker could
achieve, and reproduction steps. Examples of in-scope issues:

- Prompt-injection or hidden/bidi content in a pack that survived review.
- A pack impersonating a handle, or claiming a reserved handle.
- A flaw in the build/sign/manifest tooling that could let unverified bytes
  be installed.

## Our response

- **Triage targets:** mitigation within **24h** for critical
  (publicly-exploitable prompt-injection) and **7 days** for high severity.
- **Revocation:** maintainers record the affected version and a public reason in
  `registry/revocations.json`. The signed catalog carries that list to consumers.
- **Unresponsive owners:** for a community pack whose owner does not address
  a security issue, atheory-ai patches or withdraws the pack under its
  standing security veto (`.specs/04-canonical-vs-community.md`).

## Withdrawing a published version

1. Open a reviewed PR adding an entry to `registry/revocations.json`. Use the
   full pack name, the exact published version, and a public reason. For example,
   `{"name":"owner.javascript.tool.example","version":"1.2.3","reason":"Incorrect migration guidance can delete user data"}`.
   Keep earlier withdrawals, including versions that have left the catalog.
2. After merge, run `gh workflow run release-manifest.yml --ref main` in this
   repository. This rebuilds and signs the catalog between pack releases.
3. Review the manifest and bundle PR, checking the exact entry and the other
   catalog changes. Squash-merge to publish. Consumers receive the withdrawal
   when they fetch the signed catalog. An engine with `skillex pack check`
   can apply it to an existing installation and report the reason with
   `skillex pack list`. Ordinary refresh uses the most recent saved evidence.

## Integrity guarantees (how trust reaches a consumer)

- Every tarball's SHA256 is pinned in a **cosign-signed** manifest; the
  engine refuses on mismatch.
- The verification identity + sigstore trusted root are bundled in the
  `@atheory-ai/skillex` engine (out-of-band), enabling offline verification.
- Releases carry SLSA L2 provenance.

See [`.specs/03-security.md`](.specs/03-security.md) and
[`.specs/05-distribution.md`](.specs/05-distribution.md) for details.
