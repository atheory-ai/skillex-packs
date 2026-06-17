import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Rebuild mode (no network): exercises discovery, tier derivation, and entry
// shape against the checked-in example pack. The --out path is relative to the
// repo root and lands in the gitignored registry/build/.
test("build-manifest (rebuild) emits a well-formed entry for the example pack", () => {
  const rel = "registry/build/test-manifest.json";
  execFileSync("node", [join(ROOT, "scripts", "build-manifest.mjs"), "--out", rel],
    { cwd: ROOT, encoding: "utf8" });
  const m = JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

  assert.equal(m.schemaVersion, 1);
  assert.equal(m.registry, "atheory-ai/skillex-packs");
  assert.ok(Array.isArray(m.packs));

  const p = m.packs.find((x) => x.name === "atheory-ai.javascript.tool.example");
  assert.ok(p, "example pack present in manifest");
  assert.equal(p.handle, "atheory-ai");
  assert.equal(p.tier, "core"); // derived from handle
  assert.equal(p.tier !== undefined, true);
  assert.match(p.tarball.sha256, /^[a-f0-9]{64}$/);
  assert.ok(p.tarball.size > 0);
  assert.ok(p.tarball.url.includes("/pack/atheory-ai.javascript.tool.example/v"));
});
