import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { ROOT, writeProjectFile } from "./helpers/skillex.mjs";

test("publish retained versions, retire an archive and withdraw installed guidance", t => {
  const dir = mkdtempSync(join(tmpdir(), "skillex-publisher-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(join(ROOT, "scripts"), join(dir, "scripts"), { recursive: true });
  symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"), "junction");
  const catalog = join(dir, "registry/manifest.json");
  writeProjectFile(dir, "registry/manifest.json", JSON.stringify({ packs: [], revocations: [] }));
  const support = entries => writeProjectFile(dir, "registry/supported-versions.json", JSON.stringify(entries));
  support([]);
  const publish = (entries, stage, options = []) => {
    writeProjectFile(dir, "registry/revocations.json", JSON.stringify(entries));
    execFileSync(process.execPath, ["scripts/build-manifest.mjs", ...options], { cwd: dir });
    cpSync(catalog, join(dir, stage + ".json"));
    return JSON.parse(readFileSync(catalog));
  };
  for (const leaf of ["keep", "withdraw"]) {
    const pack = `ecosystems/javascript/packs/fixture/tool.${leaf}`;
    const manifest = { name: `fixture.javascript.tool.${leaf}`, version: "1.0.0",
      skills: [{ file: "usage.md", scope: "repo", "activate-when": { "files-present": ["package.json"] } }] };
    if (leaf === "keep") manifest.registry = { compatibility: { skillex: ">=1 <2" } };
    writeProjectFile(dir, pack + "/pack.yaml", JSON.stringify(manifest));
    writeProjectFile(dir, pack + "/usage.md", `---\nname: ${leaf}\ntopics: [publisher]\n---\n\nGuidance for ${leaf}.\n`);
  }
  const before = publish([], "before");
  const revocation = { name: "fixture.javascript.tool.withdraw", version: "1.0.0", reason: "Fixture withdrawal" };
  const after = publish([revocation], "after");
  assert.equal(before.packs.length, 2);
  assert.deepEqual(after.packs, before.packs);
  assert.deepEqual(after.revocations, [revocation]);

  const v1 = before.packs.find(entry => entry.name.endsWith(".keep"));
  const supported = { name: v1.name, version: v1.version };
  support([supported]);
  const packDir = "ecosystems/javascript/packs/fixture/tool.keep";
  const source = JSON.parse(readFileSync(join(dir, packDir, "pack.yaml")));
  source.version = "2.0.0";
  source.registry.compatibility.skillex = ">=2 <3";
  writeProjectFile(dir, packDir + "/pack.yaml", JSON.stringify(source));
  writeProjectFile(dir, packDir + "/usage.md", "---\nname: keep\ntopics: [publisher]\n---\n\nGuidance for keep v2.\n");
  const versions = publish([revocation], "versions");
  const [v2, older] = versions.packs.filter(entry => entry.name === v1.name);
  assert.deepEqual(older, v1);
  assert.equal(v2.version, "2.0.0");
  assert.deepEqual(v2.compatibility, { skillex: ">=2 <3" });
  assert.notEqual(v1.tarball.sha256, v2.tarball.sha256);
  for (const entry of [v1, v2]) {
    const archive = readFileSync(join(dir, "registry/build/pack", entry.name, "v" + entry.version, basename(entry.tarball.url)));
    assert.equal(archive.length, entry.tarball.size);
    assert.equal(createHash("sha256").update(archive).digest("hex"), entry.tarball.sha256);
  }
  // A source edit awaiting the next release cannot change an advertised pin.
  source.registry.compatibility.skillex = ">=99";
  writeProjectFile(dir, packDir + "/pack.yaml", JSON.stringify(source));
  const fromReleases = ["--from-releases"];
  assert.deepEqual(publish([revocation], "repeat", fromReleases).packs, versions.packs);
  support([]);
  const retired = publish([revocation], "retired", fromReleases);
  assert.deepEqual(retired.packs, versions.packs.filter(entry => entry.version !== v1.version || entry.name !== v1.name));
  assert.deepEqual(retired.revocations, [revocation]);
  const withdrawal = { ...supported, reason: "Withdraw retired fixture" };
  const withdrawn = publish([revocation, withdrawal], "withdrawn", fromReleases);
  assert.deepEqual(withdrawn.packs, retired.packs);
  assert.deepEqual(withdrawn.revocations, [revocation, withdrawal]);

  // The pinned npm consumer predates pack check. Exercise a compatible engine
  // checkout using its test-only signer and real CLI/MCP entry points.
  if (process.env.SKILLEX_ENGINE_DIR) {
    const engine = resolve(process.env.SKILLEX_ENGINE_DIR);
    const overlay = join(dir, "overlay.json");
    writeFileSync(overlay, JSON.stringify({ Replace: {
      [join(engine, "internal/verify/publisher_withdrawal_test.go")]: join(ROOT, "test/engine/publisher_withdrawal_test.go"),
    } }));
    execFileSync("go", ["test", "-overlay", overlay, "./internal/verify", "-run", "^TestPublisher(Withdrawal|Compatibility)$", "-count=1", "-v"],
      { cwd: engine, env: { ...process.env, SKILLEX_PUBLISHER_FIXTURE: dir }, stdio: "inherit" });
  }
});
