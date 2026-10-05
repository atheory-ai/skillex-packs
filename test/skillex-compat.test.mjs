import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverPacks, packFileEntries } from "../scripts/lib/packs.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLEX = join(ROOT, "node_modules/@atheory-ai/skillex/bin/skillex.js");

function materializePack(pack, t) {
  const project = mkdtempSync(join(tmpdir(), "skillex-pack-compat-"));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  const packRoot = join(project, "skillex");
  mkdirSync(packRoot, { recursive: true });
  for (const entry of packFileEntries(pack)) {
    const destination = join(packRoot, entry.path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, entry.data);
  }
  writeFileSync(join(project, "skillex.json"), JSON.stringify({ Version: 4, Rules: [] }));
  writeFileSync(join(project, "package.json"), JSON.stringify({ private: true }));
  return project;
}

function runSkillex(project, args) {
  const result = spawnSync(process.execPath, [SKILLEX, ...args], {
    cwd: project,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result;
}

test("every pack manifest loads with Skillex 0.10", (t) => {
  const packs = discoverPacks(ROOT);
  assert.ok(packs.length > 0, "registry contains packs to validate");
  for (const pack of packs) {
    const result = runSkillex(materializePack(pack, t), ["refresh"]);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.doesNotMatch(output, /Warnings:|parsing .*pack\.yaml/, pack.name);
  }
});

test("example pack supports bounded query and read", (t) => {
  const pack = discoverPacks(ROOT).find((candidate) =>
    candidate.name === "atheory-ai.javascript.tool.example");
  assert.ok(pack, "example pack is present");
  const project = materializePack(pack, t);
  runSkillex(project, ["refresh"]);

  const discovery = JSON.parse(runSkillex(project,
    ["query", "--topic", "example", "--json"]).stdout);
  assert.equal(discovery.type, "results");
  assert.equal(discovery.returned_count, 1);

  const result = JSON.parse(runSkillex(project,
    ["read", "--ref", discovery.results[0].ref, "--json"]).stdout);
  assert.equal(result.ref, discovery.results[0].ref);
  assert.match(result.content, /Example Pack/);
});
