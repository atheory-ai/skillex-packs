import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverPacks, packFileEntries, readPackYaml } from "../scripts/lib/packs.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "node_modules/@atheory-ai/skillex/bin/skillex.js");

function consumer(t) {
  const pack = discoverPacks(ROOT).find((p) =>
    p.name === "atheory-ai.polyglot.pattern.application-design");
  assert.ok(pack);
  const project = mkdtempSync(join(tmpdir(), "application-design-"));
  t.after(() => rmSync(project, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  for (const entry of packFileEntries(pack)) {
    const destination = join(project, "skillex", entry.path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, entry.data);
  }
  writeFileSync(join(project, "skillex.json"), JSON.stringify({ Version: 4, Rules: [] }));
  writeFileSync(join(project, "package.json"), JSON.stringify({ private: true }));
  const run = (...args) => {
    const result = spawnSync(process.execPath, [CLI, ...args], { cwd: project, encoding: "utf8" });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.doesNotMatch(result.stderr, /Warnings:|parsing .*pack\.yaml/);
    return result;
  };
  const query = (...args) => JSON.parse(run("query", ...args, "--json").stdout);
  const optIn = () => writeFileSync(join(project, "application-design.yaml"), "platforms: [web]\n");
  return { project, pack, run, query, optIn };
}

test("application design requires opt-in and deactivates when the marker is removed", (t) => {
  const { project, pack, run, query, optIn } = consumer(t);
  run("refresh");
  assert.equal(query("--topic", "application-design").type, "no_match");
  optIn();
  const count = readPackYaml(pack.dir).skills.length;
  assert.ok(run("refresh").stderr.includes(`${count} skills, ${count} test scenarios`));
  assert.equal(query("--topic", "notifications").returned_count, 1);
  rmSync(join(project, "application-design.yaml"));
  run("refresh");
  assert.equal(query("--topic", "application-design").type, "no_match");
});

test("application design supports bounded discovery, focused reads, and valid scenarios", (t) => {
  const { project, pack, run, query, optIn } = consumer(t);
  optIn();
  run("refresh");
  const broad = query("--topic", "application-design");
  assert.equal(broad.match_count, readPackYaml(pack.dir).skills.length);
  assert.equal(broad.returned_count, 8);
  assert.equal(broad.too_broad, true);
  assert.ok(broad.narrow_with.tags.some((tag) => tag.value === "contracts"));
  assert.ok(broad.results.every((result) => !Object.hasOwn(result, "content")));

  const contracts = query("--tags", "contracts");
  assert.equal(contracts.returned_count, 3);
  assert.notEqual(contracts.too_broad, true);
  const feedback = query("--topic", "notifications");
  assert.equal(feedback.returned_count, 1);
  const selected = feedback.results[0];
  const section = JSON.parse(run("read", "--ref", selected.ref, "--section", "verify", "--json").stdout);
  assert.match(section.content, /Important errors are not available only in disappearing toasts/);
  assert.doesNotMatch(section.content, /An export completion/);

  for (const platform of ["web", "desktop", "mobile"]) {
    const result = query("--tags", `platform-${platform}`);
    assert.equal(result.returned_count, 1);
    assert.ok(result.results[0].topics.includes(`${platform}-platform`));
  }

  // Scenario validation uses authored rule directories, rather than activated pack rules.
  const manifest = readPackYaml(pack.dir);
  writeFileSync(join(project, "skillex.json"), JSON.stringify({ Version: 4, Rules: [{
    Scope: "**", Skills: manifest.skills.map((skill) => `skillex/${skill.file}`),
  }] }));
  const validation = run("test", "validate", "--check", "--json");
  assert.doesNotMatch(validation.stderr, /No skill directories/);
  assert.equal(JSON.parse(validation.stdout), null, "all paired scenarios validate without errors");
});

test("interface design discovery groups related decisions and retains their tradeoffs", (t) => {
  const { run, query, optIn } = consumer(t);
  optIn();
  run("refresh");
  const design = query("--tags", "ui-design");
  assert.equal(design.returned_count, 8);
  assert.notEqual(design.too_broad, true);
  assert.ok(design.results.every((result) => result.description.startsWith("Use when")));

  // A natural concept in the description must find the coherent comparison,
  // rather than a separate file for each type of editing container.
  const modal = query("--search", "modal");
  assert.ok(modal.results.some((result) => result.topics.includes("editing-surfaces")));
  const editing = query("--topic", "editing-surfaces");
  assert.equal(editing.returned_count, 1);
  const content = JSON.parse(run("read", "--ref", editing.results[0].ref, "--json").stdout).content;
  for (const alternative of ["Inline editing", "inspector", "separate destination", "modal dialog"]) {
    assert.ok(content.includes(alternative), alternative);
  }
  assert.match(content, /Presentation does not determine the save policy/);

  const hierarchy = query("--topic", "visual-hierarchy");
  assert.equal(hierarchy.returned_count, 1);
  assert.notEqual(hierarchy.results[0].ref, editing.results[0].ref);
});
