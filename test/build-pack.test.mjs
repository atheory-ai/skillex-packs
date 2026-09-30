import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("example replacement archive contains engine-compatible activation and matches its release identity", () => {
  const name = "atheory-ai.javascript.tool.example";
  const built = JSON.parse(execFileSync("node", [join(ROOT, "scripts/build-pack.mjs"), name, "--json"], { cwd: ROOT, encoding: "utf8" }));
  assert.equal(built.version, "0.1.1");
  const archive = join(ROOT, built.tarball);
  const bytes = readFileSync(archive);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), built.sha256);
  assert.equal(bytes.length, built.size);
  const manifest = parse(execFileSync("tar", ["-xOzf", archive, "pack.yaml"], { encoding: "utf8" }));
  assert.equal(manifest.name, built.name);
  assert.equal(manifest.version, built.version);
  assert.equal(manifest.registry.license, "Apache-2.0");
  assert.equal(manifest.activation, undefined);
  assert.equal(manifest.scopes, undefined);
  assert.equal(manifest.license, undefined);
  assert.deepEqual(manifest.skills[0]["activate-when"], { "files-present": ["package.json"] });
  const listing = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n");
  assert.ok(listing.includes(manifest.skills[0].file));
});
