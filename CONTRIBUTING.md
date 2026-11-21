# Contributing to skillex-packs

Thanks for contributing! This repo is the canonical registry of **skillex
packs** — markdown + YAML + JSON that agents read as guidance. The full
design lives in [`.specs/`](.specs/README.md); the working guides live as
skillex skills in [`skills/`](skills/) and are queryable with
`skillex query`.

## Quick start

```bash
npm install            # installs the pinned skillex dev tooling
npm run validate       # skillex test validate — schema + lint + structure
```

If you have the skillex MCP server connected, ask it for the relevant skill;
otherwise:

```bash
skillex query --search "authoring a pack"
skillex query --search "sign off commit dco"
```

## The pack lifecycle (and where each step is documented)

| Step | Skill |
|---|---|
| Name a pack; pick handle / ecosystem / tier | `skills/naming-and-tiers.md` |
| Create the pack | `skills/authoring-a-pack.md` |
| Version it / breaking changes / renames | `skills/versioning-a-pack.md` |
| Commit, sign off, open the PR | `skills/contributing-and-dco.md` |
| Pass the security & review gate | `skills/security-and-review.md` |
| Publish via release tag | `skills/releasing-a-pack.md` |

## Naming, in one line

Packs are **handle-first**:

```
<handle>.<ecosystem>.<scope>.<name>[.<descriptor>]
```

`handle` is your verified GitHub login (or an org you belong to);
`ecosystem` is the **language**, not the runtime (`javascript`, `python`,
`go`, …). There is no tier segment — tier is derived from the handle. See
[`.specs/01-naming-and-structure.md`](.specs/01-naming-and-structure.md).

## Licensing & the DCO

By contributing you agree to two things:

1. **License.** Your contribution is licensed inbound under the repository's
   [Apache-2.0](LICENSE). You keep your copyright; there is **no CLA**.
2. **Developer Certificate of Origin.** You certify the [`DCO`](DCO)
   (version 1.1) for every commit by adding a `Signed-off-by` trailer.

### Sign off and sign your commits

Every commit must carry **both**:

- `-s` — the DCO sign-off (`Signed-off-by: Your Name <you@example.com>`,
  matching the commit author).
- `-S` — a cryptographic signature (GPG or SSH key registered with GitHub).

```bash
git commit -s -S -m "feat(pack): alice.javascript.tool.eslint.airbnb@0.1.0"
```

Tip: `git config commit.gpgsign true` makes `-S` automatic. To add a missing
sign-off: `git commit --amend -s`, or `git rebase --signoff HEAD~N` for a
range. CI on `main` rejects commits missing either the sign-off or the
signature.

Why both: the DCO sign-off is a *legal attestation* ("I have the right to
submit this"); the signature is *integrity* ("this commit really came from
me"). Details in `skills/contributing-and-dco.md`.

## Review

- **Core packs** (`atheory-ai.*`): 2 approvals, one a pack OWNER.
- **A new handle's first community pack**: 1 approval from atheory-ai
  (anti-typosquat / anti-spam / anti-prompt-injection gate).
- **Subsequent revisions**: the pack's OWNERS, via CODEOWNERS.

atheory-ai retains a standing veto for security violations. See
`skills/security-and-review.md`.

## Keeping an earlier release available

Add the exact pack name and version to `registry/supported-versions.json`
before it leaves the signed catalog. Remove the declaration and publish the
catalog to retire that version from discovery. See the
[versioning procedure](.specs/02-versioning.md#multiple-coexisting-majors)
for an example and the separate withdrawal procedure.

## Testing catalog publication

Run `npm ci` and `npm test` for the publisher tests. To repeat the signed
consumer test locally, point `SKILLEX_ENGINE_DIR` at a Skillex source checkout
with the compatible pack resolver and its Go toolchain installed:

```sh
SKILLEX_ENGINE_DIR=../skillex node --test test/published-withdrawal.test.mjs
```

CI pins the engine revision in the validate workflow. The fixture publishes
two versions, verifies which archive each engine installs and exercises the
no-match case. It also checks the effect of a signed withdrawal on discovery
and reads through a running MCP process.

## Reporting security issues

Do not open a public issue for a vulnerability. Use GitHub Security
Advisories for private disclosure. See
[`.specs/03-security.md`](.specs/03-security.md).
