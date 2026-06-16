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

## Tag protection

- [ ] Protect tags matching `pack/*` and `manifest/*` (no force-push/delete).
- [ ] Restrict creation of `pack/atheory-ai.*` and `manifest/*` tags to the
      release workflow via a deploy environment with a manual approval gate.

## Organization

- [ ] Enforce 2FA for all members of `@atheory-ai/skillex-maintainers`.
- [ ] CI uses short-lived OIDC tokens (cosign keyless, any publish) — no
      static PATs.

## Notes

- Signature verification in CI is intentionally **not** a workflow: runners
  don't hold contributors' allowed-signers. GitHub's "Require signed commits"
  setting is the enforcement point; the `dco` workflow covers the
  `Signed-off-by` attestation.
