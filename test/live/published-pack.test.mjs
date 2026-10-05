// Explicit network integration check. npm test remains independent of the live registry.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createProject, ROOT, runSkillex, refresh, query } from "../helpers/skillex.mjs";

const NAME = "atheory-ai.javascript.tool.example";
const MANIFEST_URL = "https://raw.githubusercontent.com/atheory-ai/skillex-packs/main/registry/manifest.json";
const committed = JSON.parse(readFileSync(join(ROOT, "registry/manifest.json"), "utf8"));
const expected = committed.packs.find((pack) => pack.name === NAME);

test("released 0.10 verifies, previews, installs, and consumes the published example offline", { timeout: 240_000 }, (t) => {
  assert.ok(expected, "committed manifest identifies the published example");
  const project = createProject(t, {
    "skillex.json": JSON.stringify({ Version: 4, Rules: [], registries: [{ name: "canonical", url: MANIFEST_URL }] }),
  });
  const before = readFileSync(join(project, "skillex.json"), "utf8");
  const preview = JSON.parse(runSkillex(project, ["pack", "get", NAME, "--preview", "--json"]).stdout);
  assert.equal(preview.installed, false);
  assert.equal(preview.pack.name, NAME);
  assert.equal(preview.pack.version, expected.version);
  assert.equal(preview.pack.tarball.sha256, expected.tarball.sha256);
  assert.ok(preview.files.includes("pack.yaml"));
  assert.ok(preview.files.includes("skills/usage.md"));
  assert.match(preview.contents["skills/usage.md"], /# Example Pack/);
  assert.equal(existsSync(join(project, ".skillex")), false, "preview does not install or build an index");
  assert.equal(readFileSync(join(project, "skillex.json"), "utf8"), before);

  const installed = JSON.parse(runSkillex(project, ["pack", "get", NAME, "--yes", "--json"]).stdout);
  assert.equal(installed.installed, true);
  assert.equal(installed.pack.version, expected.version);
  const packDir = join(project, ".skillex/packs", `${NAME}@${expected.version}`);
  const lock = JSON.parse(readFileSync(join(packDir, "manifest.lock.json"), "utf8"));
  assert.equal(lock.manifestURL, MANIFEST_URL);
  assert.equal(lock.pack.tarball.sha256, expected.tarball.sha256);
  const archive = readFileSync(join(packDir, "archive.tar.gz"));
  assert.equal(createHash("sha256").update(archive).digest("hex"), expected.tarball.sha256);
  assert.equal(archive.length, expected.tarball.size);
  const signed = JSON.parse(Buffer.from(lock.signedManifest, "base64").toString("utf8"));
  assert.ok(signed.packs.some((entry) => entry.name === NAME && entry.tarball.sha256 === expected.tarball.sha256));
  assert.ok(Buffer.from(lock.signatureBundle, "base64").length > 0, "signature evidence is retained");

  // Go's HTTP client uses these proxies: any HTTP(S) request would fail locally.
  const offline = { env: { ...process.env, SKILLEX_MCP_TRUST_CONFIG: join(project, ".fixture-trust.yaml"),
    HTTP_PROXY: "http://127.0.0.1:1", HTTPS_PROXY: "http://127.0.0.1:1",
    http_proxy: "http://127.0.0.1:1", https_proxy: "http://127.0.0.1:1", NO_PROXY: "", no_proxy: "" } };
  const list = JSON.parse(runSkillex(project, ["pack", "list", "--json"], offline).stdout);
  assert.deepEqual(list, [{ name: NAME, version: expected.version, tier: "core", registry: committed.registry }]);
  refresh(project, offline);
  const discovered = query(project, ["--topic", "example"], offline);
  assert.equal(discovered.returned_count, 1);
  assert.equal(discovered.results[0].source_type, "pack");
  const selected = JSON.parse(runSkillex(project, ["read", "--ref", discovered.results[0].ref, "--json"], offline).stdout);
  assert.match(selected.content, /# Example Pack/);

  writeFileSync(join(packDir, "skills/usage.md"), "# Changed after verification\n");
  assert.throws(() => runSkillex(project, ["pack", "list", "--json"], offline), /differs|mismatch|changed|tamper/i);
  assert.throws(() => refresh(project, offline), /validating installed registry packs/);
});
