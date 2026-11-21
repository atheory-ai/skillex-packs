import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ROOT, writeProjectFile } from "./helpers/skillex.mjs";

test("publish a withdrawal between releases with both archive pins intact", t => {
  const dir = mkdtempSync(join(tmpdir(), "skillex-publisher-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(join(ROOT, "scripts"), join(dir, "scripts"), { recursive: true });
  symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"), "junction");
  const catalog = join(dir, "registry/manifest.json");
  writeProjectFile(dir, "registry/manifest.json", JSON.stringify({ revocations: [] }));
  const publish = (entries, stage) => {
    writeProjectFile(dir, "registry/revocations.json", JSON.stringify(entries));
    execFileSync(process.execPath, ["scripts/build-manifest.mjs"], { cwd: dir });
    cpSync(catalog, join(dir, stage + ".json"));
    return JSON.parse(readFileSync(catalog));
  };
  for (const leaf of ["keep", "withdraw"]) {
    const pack = `ecosystems/javascript/packs/fixture/tool.${leaf}`;
    const manifest = { name: `fixture.javascript.tool.${leaf}`, version: "1.0.0",
      skills: [{ file: "usage.md", scope: "repo", "activate-when": { "files-present": ["package.json"] } }] };
    writeProjectFile(dir, pack + "/pack.yaml", JSON.stringify(manifest));
    writeProjectFile(dir, pack + "/usage.md", `---\nname: ${leaf}\ntopics: [publisher]\n---\n\nGuidance for ${leaf}.\n`);
  }
  const before = publish([], "before");
  const revocation = { name: "fixture.javascript.tool.withdraw", version: "1.0.0", reason: "Fixture withdrawal" };
  const after = publish([revocation], "after");
  assert.equal(before.packs.length, 2);
  assert.deepEqual(after.packs, before.packs);
  assert.deepEqual(after.revocations, [revocation]);

  // The pinned npm consumer predates pack check. Exercise a compatible engine
  // checkout using its test-only signer and real CLI/MCP entry points.
  if (process.env.SKILLEX_ENGINE_DIR) {
    const engine = resolve(process.env.SKILLEX_ENGINE_DIR);
    const overlay = join(dir, "overlay.json");
    writeFileSync(overlay, JSON.stringify({ Replace: {
      [join(engine, "internal/verify/publisher_withdrawal_test.go")]: join(ROOT, "test/engine/publisher_withdrawal_test.go"),
    } }));
    execFileSync("go", ["test", "-overlay", overlay, "./internal/verify", "-run", "^TestPublisherWithdrawal$", "-count=1", "-v"],
      { cwd: engine, env: { ...process.env, SKILLEX_PUBLISHER_FIXTURE: dir }, stdio: "inherit" });
  }
});
