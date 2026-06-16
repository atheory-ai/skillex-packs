# Tests: contributing-and-dco.md

## Validation: the two signs

Prompt: What do `-s` and `-S` each do on a commit, and are both required here?
Success criteria:
  - `-s` adds the DCO `Signed-off-by` (legal attestation); `-S` is a cryptographic signature (integrity).
  - Both are required; CI on main rejects commits missing either.

## Validation: fix a missing sign-off

Prompt: CI says my last commit is missing a sign-off. How do I fix it?
Success criteria:
  - `git commit --amend -s` (or `git rebase --signoff HEAD~N` for a range).

## Validation: ownership

Prompt: If I contribute a community pack, do I give up copyright, and can I block atheory-ai from editing it?
Success criteria:
  - Contributor keeps copyright; licenses inbound under Apache-2.0 with DCO, no CLA.
  - OWNERS is maintenance routing; atheory-ai can still fix security, re-route, or withdraw.
