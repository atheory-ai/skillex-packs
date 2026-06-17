
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
- **Manifest releases:** the `manifest` release uses a single long-lived tag.
  Create it **once**:
  - [ ] As an admin, create a signed tag named `manifest` (e.g.
        `git tag -s manifest -m "registry manifest" && git push origin manifest`)
        and a GitHub Release for it.
  - Thereafter `release-manifest` only **clobbers that release's assets** —
    no tag creation, so it stays within the ruleset.
- [ ] Keep no-force-push / no-delete on `pack/*` and `manifest`.

## Organization

- [ ] Enforce 2FA for all members of `@atheory-ai/skillex-maintainers`.
- [ ] CI uses short-lived OIDC tokens (cosign keyless, any publish) — no
      static PATs.

## Notes

- Signature verification in CI is intentionally **not** a workflow: runners
  don't hold contributors' allowed-signers. GitHub's "Require signed commits"
  setting is the enforcement point; the `dco` workflow covers the
  `Signed-off-by` attestation.
