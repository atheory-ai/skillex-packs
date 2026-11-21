import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT, writeProjectFile } from "./helpers/skillex.mjs";

test("review declarations against previously published entries and reject stale catalogs", t => {
  const dir = mkdtempSync(join(tmpdir(), "skillex-support-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const write = (file, data) => writeProjectFile(dir, "registry/" + file, JSON.stringify(data));
  const pack = { name: "owner.javascript.tool.example", version: "1.0.0" };
  const entry = { ...pack, extension: { original: true } };
  const catalog = packs => write("manifest.json", { packs });
  const support = entries => write("supported-versions.json", entries);
  catalog([entry]);
  support([]);
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  git("init", "--quiet");
  git("add", "registry");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.org", "-c", "commit.gpgSign=false", "commit", "-qm", "baseline");
  const base = git("rev-parse", "HEAD");
  const check = expected => {
    const result = spawnSync(process.execPath, [join(ROOT, "scripts/check-supported-versions.mjs"), base], { cwd: dir, encoding: "utf8" });
    if (expected) {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, expected);
    } else {
      assert.equal(result.status, 0, result.stderr);
    }
  };
  support([pack, pack]);
  check(/duplicate supported/);
  support([{ ...pack, version: "^1" }]);
  check(/exact version/);
  support([{ ...pack, version: "1.1.0" }]);
  check(/absent from the previous catalog/);
  support([pack]);
  check();
  catalog([]);
  check(/missing supported/);
  catalog([pack]);
  check(/changed published/);
  support([]);
  check(/unexpected catalog entry/);
  catalog([]);
  check();
});
