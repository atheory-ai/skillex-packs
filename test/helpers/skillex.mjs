import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CLI = join(ROOT, "node_modules/@atheory-ai/skillex/bin/skillex.js");

export function writeProjectFile(project, path, content) {
  const destination = join(project, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content);
}

export function createProject(t, files = {}) {
  const project = mkdtempSync(join(tmpdir(), "skillex-0.10-contract-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  writeProjectFile(project, "skillex.json", JSON.stringify({ Version: 4, Rules: [] }));
  writeProjectFile(project, "package.json", JSON.stringify({ name: "contract-fixture", private: true }));
  writeProjectFile(project, ".fixture-trust.yaml", "Version: 1\n");
  for (const [path, content] of Object.entries(files)) writeProjectFile(project, path, content);
  return project;
}

export function runSkillex(project, args, options = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: project, encoding: "utf8", timeout: 60_000,
    env: { ...process.env, SKILLEX_MCP_TRUST_CONFIG: join(project, ".fixture-trust.yaml") }, ...options,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${args.join(" ")}:\n${result.stdout}\n${result.stderr}`);
  return result;
}

export function refresh(project, options = {}) {
  const result = runSkillex(project, ["refresh"], options);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /Warnings:|parsing .*pack\.yaml|invalid pack/);
  return result;
}

export function query(project, args = [], options = {}) {
  return JSON.parse(runSkillex(project, ["query", ...args, "--json"], options).stdout);
}
