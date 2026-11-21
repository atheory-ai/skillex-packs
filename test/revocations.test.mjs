import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT } from "./helpers/skillex.mjs";
import { validateRevocations, readRevocations } from "../scripts/lib/revocations.mjs";

const withdrawal = { name: "owner.javascript.tool.example", version: "1.0.0", reason: "Faulty guidance" };

test("validate exact identities, public reasons and uniqueness", () => {
  for (const version of ["1.2.3", "2.0.0-rc.1+build.5"]) {
    assert.ok(validateRevocations([{ ...withdrawal, version }]).has(`${withdrawal.name}@${version}`));
  }
  for (const entries of [null, {}, [null], [withdrawal, withdrawal], [{ ...withdrawal, reason: " " }],
    ...["v1.0.0", "1", "^1.0.0", "01.2.3", "1.0.0-01", "*"].map(version => [{ ...withdrawal, version }]),
    [{ ...withdrawal, name: "../wrong" }], [{ ...withdrawal, Name: "other.javascript.tool.example" }]]) {
    assert.throws(() => validateRevocations(entries));
  }
});

test("preserve published and pending withdrawals and reject stale publication PRs", t => {
  const dir = mkdtempSync(join(tmpdir(), "skillex-registry-review-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "registry"));
  const write = (file, value) => writeFileSync(join(dir, "registry", file), JSON.stringify(value));
  const manifest = (revocations) => write("manifest.json", { revocations });
  const source = (entries) => write("revocations.json", entries);
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  git("init", "--quiet");
  const commit = () => {
    git("add", "registry");
    git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.org", "-c", "commit.gpgSign=false", "commit", "-qm", "fixture");
    return git("rev-parse", "HEAD");
  };
  const check = (base, failure) => {
    const result = spawnSync(process.execPath, [join(ROOT, "scripts/check-revocations.mjs"), base], { cwd: dir, encoding: "utf8" });
    if (failure) { assert.notEqual(result.status, 0); assert.match(result.stderr, failure); }
    else assert.equal(result.status, 0, result.stderr);
  };
  manifest([]);
  const bootstrap = commit();
  source([withdrawal]);
  check(bootstrap);
  const pending = commit();
  source([]);
  check(pending, /removed revocation/);
  source([withdrawal]);
  write("manifest.json", { generatedAt: "later", revocations: [] });
  check(pending, /differ from the reviewed source/);
  manifest([withdrawal]);
  check(pending);
  const published = commit();
  manifest([]);
  source([]);
  check(published, /removed revocation/);
  manifest([withdrawal]);
  assert.throws(() => readRevocations(dir), /removed revocation/);
});
