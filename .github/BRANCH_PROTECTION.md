
# Branch protection & repo settings

These cannot be expressed as files — they are GitHub settings. This is the
checklist to apply, derived from [`.specs/03-security.md`](../.specs/03-security.md).
CI workflows (`validate`, `dco`) enforce the rest.

## `main` branch protection

- [ ] Require a pull request before merging.
- [ ] Require approvals: **1** (the `validate` + `dco` checks gate the rest).
      Canonical packs require **2** — enforced via `CODEOWNERS` on
      `/ecosystems/*/packs/atheory-ai/` plus "Require review from Code Owners".
- [ ] Require status checks to pass: **`validate`**, **`dco`**.
- [ ] **Require signed commits.** (CI checks the DCO sign-off; signature
      verification is this setting.)
- [ ] Require branches to be up to date before merging.
- [ ] Do not allow force-pushes; do not allow deletions.

## Tag protection (Tag Ruleset)

The active "Tag Ruleset" restricts tag **creation** and requires **signed
tags** (OrgAdmin bypass only). CI therefore never creates tags. This implies:

- **Pack releases:** a maintainer/admin creates the signed `pack/<name>/v<x>`
  tag (this triggers `release-pack`, which only *attaches* a release to the
  existing tag — no creation by CI).
- **Manifest:** published as a file on `main` via a **reviewed PR**, not a
  release (immutable releases rule out updating one; the Tag Ruleset rules
  out creating one). `release-manifest` builds + cosign-signs and opens a
  PR; a maintainer reviews and **squash-merges** (GitHub signs the resulting
  commit). The `main` branch protection above (require-PR + approval +
  signed commits) is the gate — no extra setup needed.
  - The `manifest` tag/release created during earlier iteration is now
    **vestigial**; nothing uses it. Leave it, or have an admin delete it
    (tag deletion is blocked by the ruleset for non-admins).
- [ ] Keep no-force-push / no-delete on `pack/*` tags.

## Organization

- [ ] Enforce 2FA for all members of `@atheory-ai/skillex-maintainers`.
- [ ] CI uses short-lived OIDC tokens (cosign keyless, any publish) — no
      static PATs.

## Notes

- Signature verification in CI is intentionally **not** a workflow: runners
  don't hold contributors' allowed-signers. GitHub's "Require signed commits"
  setting is the enforcement point; the `dco` workflow covers the
  `Signed-off-by` attestation.
