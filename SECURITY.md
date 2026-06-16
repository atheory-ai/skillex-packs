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
- **Revocation:** an affected pack version is added to
  `registry/revocations.json` (signed); the engine refuses to install or
  refresh revoked versions.
- **Unresponsive owners:** for a community pack whose owner does not address
  a security issue, atheory-ai patches or withdraws the pack under its
  standing security veto (`.specs/04-canonical-vs-community.md`).

## Integrity guarantees (how trust reaches a consumer)

- Every tarball's SHA256 is pinned in a **cosign-signed** manifest; the
  engine refuses on mismatch.
- The verification identity + sigstore trusted root are bundled in the
  `@atheory-ai/skillex` engine (out-of-band), enabling offline verification.
- Releases carry SLSA L2 provenance.

See [`.specs/03-security.md`](.specs/03-security.md) and
[`.specs/05-distribution.md`](.specs/05-distribution.md) for details.
