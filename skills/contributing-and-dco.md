---
name: Contributing and the DCO Workflow
description: How to contribute to skillex-packs — the commit workflow with DCO sign-off (-s) and cryptographic signing (-S), what each means and why both are required, inbound licensing and copyright, OWNERS semantics, and the PR review flow. Use when committing or opening a PR.
topics: [contributing, dco]
tags: [contributor-guide, getting-started]
---

# Contributing and the DCO Workflow

Source of truth: `.specs/04-canonical-vs-community.md` ("Contribution terms
& licensing") and `.specs/03-security.md` (branch protection).

## Licensing & ownership in one paragraph

Community packs are **open-source contributions into this monorepo**, not
externally-owned property we host. You **keep your copyright**; you license
your contribution inbound under the repo's Apache-2.0 (`LICENSE`, `NOTICE`).
There is **no CLA** and no copyright assignment. `OWNERS` is *maintenance
routing*, not a property right — atheory-ai, as repo steward, can always fix
a security issue, re-route OWNERS, or withdraw a pack.

## Two different "signs" — you need both

| | Flag | What it is | Why |
|---|---|---|---|
| **DCO sign-off** | `git commit -s` | textual `Signed-off-by:` trailer | legal attestation: you have the right to submit this under the license |
| **Signed commit** | `git commit -S` | GPG/SSH cryptographic signature | authorship integrity (the "Verified" badge) |

They are complementary: DCO says *"I may submit this,"* the signature says
*"this really came from me, untampered."* CI on `main` rejects commits
missing **either**.

## The commit workflow

1. Set identity once: `git config user.name` / `git config user.email`
   (must match across DCO and signature).
2. Set up signing once: a GPG or SSH signing key registered with GitHub;
   optionally `git config commit.gpgsign true` so `-S` is automatic.
3. Commit with both:
   ```
   git commit -s -S -m "feat(pack): alice.javascript.tool.eslint.airbnb@0.1.0"
   ```
   The `-s` appends:
   ```
   Signed-off-by: Alice Example <alice@example.com>
   ```
   That trailer **is** your DCO affirmation (see the `DCO` file / the
   Developer Certificate of Origin 1.1).

### Fixing a missing sign-off

- Last commit: `git commit --amend -s`
- A range: `git rebase --signoff HEAD~N`

## What CI enforces on a PR

- Every commit has a valid `Signed-off-by` matching its author (DCO check).
- Every commit is cryptographically signed.
- `npm run validate` passes (schema + lint + structural checks).
- The handle is owned by the PR author (login or verified org membership)
  and isn't a reserved handle.
- The security/prompt-injection lint passes
  (`skills/security-and-review.md`).

## Review flow

- **Core pack** (`atheory-ai.*`): 2 approvals, one a pack OWNER.
- **New handle's first community pack**: 1 approval from atheory-ai
  (anti-typosquat / anti-spam / anti-injection gate).
- **Subsequent revisions**: the pack's OWNERS, routed via CODEOWNERS.
- atheory-ai retains a standing **veto for security violations**.

## After merge

Merging does not publish. Push a release tag to publish — see
`skills/releasing-a-pack.md`.
