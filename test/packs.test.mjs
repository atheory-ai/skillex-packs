import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  deriveTier, isValidHandle, discoverPacks, packFileEntries,
} from "../scripts/lib/packs.mjs";

test("deriveTier maps handle -> tier", () => {
  assert.equal(deriveTier("atheory-ai"), "core");
  assert.equal(deriveTier("vercel"), "community"); // not granted official yet
  assert.equal(deriveTier("alice"), "community");
});

test("isValidHandle accepts GitHub-style logins, rejects others", () => {
  for (const h of ["alice", "acme-labs", "a", "atheory-ai", "abc123"]) {
    assert.ok(isValidHandle(h), `expected valid: ${h}`);
  }
  for (const h of ["-bad", "bad-", "UPPER", "a.b", "a/b", "a b", ""]) {
    assert.ok(!isValidHandle(h), `expected invalid: ${h}`);
  }
});

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), "skillex-packs-fix-"));
  const dir = join(root, "ecosystems/javascript/packs/alice/tool.eslint.airbnb");
  mkdirSync(join(dir, "skills"), { recursive: true });
  writeFileSync(join(dir, "pack.yaml"),
    "name: alice.javascript.tool.eslint.airbnb\nversion: 0.1.0\ndescription: x\nlicense: MIT\n");
  writeFileSync(join(dir, "skills", "usage.md"), "# usage\n");
  writeFileSync(join(dir, "OWNERS"), "@alice\n");
  return root;
}

test("discoverPacks derives handle-first name + tier from the path", () => {
  const packs = discoverPacks(fixtureRoot());
  assert.equal(packs.length, 1);
  const p = packs[0];
  assert.equal(p.name, "alice.javascript.tool.eslint.airbnb");
  assert.equal(p.handle, "alice");
  assert.equal(p.ecosystem, "javascript");
  assert.equal(p.leaf, "tool.eslint.airbnb");
  assert.equal(p.tier, "community");
});

test("packFileEntries excludes OWNERS, sorts, normalizes paths", () => {
  const [pack] = discoverPacks(fixtureRoot());
  const paths = packFileEntries(pack).map((e) => e.path);
  assert.ok(!paths.includes("OWNERS"), "OWNERS must not ship");
  assert.deepEqual(paths, [...paths].sort(), "entries must be sorted");
  assert.ok(paths.includes("pack.yaml"));
  assert.ok(paths.includes("skills/usage.md"));
});
