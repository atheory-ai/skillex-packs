import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "scripts", "lint-pack.mjs");

// Run lint-pack with cwd at a fixture root; it scans cwd/ecosystems/**.
function runLint(root) {
  try {
    const out = execFileSync("node", [SCRIPT, "--json"], { cwd: root, encoding: "utf8" });
    return { code: 0, ...JSON.parse(out) };
  } catch (e) {
    return { code: e.status, ...JSON.parse(e.stdout) };
  }
}

// A valid engine pack (engine fields + registry block), with single-field
// overrides so each test tweaks just the thing under test.
const DEFAULT_SKILLS =
  "skills:\n  - file: skills/usage.md\n    activate-when:\n      files-present: [package.json]\n    scope: subtree\n";

function writePack(root, opts = {}) {
  const {
    handle = "alice", eco = "javascript", leaf = "tool.eslint.airbnb",
    name, license = "MIT", registry = true, skillsYaml, skill, extra,
  } = opts;
  const dir = join(root, `ecosystems/${eco}/packs/${handle}/${leaf}`);
  mkdirSync(join(dir, "skills"), { recursive: true });
  const reg = registry ? `registry:\n  license: ${license}\n` : "";
  writeFileSync(join(dir, "pack.yaml"),
    `name: ${name ?? `${handle}.${eco}.${leaf}`}\nversion: 0.1.0\ndescription: x\n${skillsYaml ?? DEFAULT_SKILLS}${reg}`);
  writeFileSync(join(dir, "skills", "usage.md"), skill ?? "# usage\n\nLead with the rule.\n");
  writeFileSync(join(dir, "README.md"), "# r\n");
  writeFileSync(join(dir, "OWNERS"), "@a\n");
  writeFileSync(join(dir, "CHANGELOG.md"), "# c\n");
  for (const [f, c] of Object.entries(extra ?? {})) writeFileSync(join(dir, f), c);
  return root;
}

const tmp = (p) => mkdtempSync(join(tmpdir(), p));

test("clean pack passes with no errors", () => {
  const r = runLint(writePack(tmp("lint-ok-")));
  assert.equal(r.code, 0, r.errors?.join("\n"));
  assert.equal(r.errors.length, 0);
});

test("reserved handle is rejected", () => {
  const r = runLint(writePack(tmp("lint-resv-"), { handle: "core", name: "core.javascript.tool.eslint.airbnb" }));
  assert.equal(r.code, 1);
  assert.ok(r.errors.some((e) => /reserved/.test(e)));
});

test("runtime token as ecosystem is rejected", () => {
  const r = runLint(writePack(tmp("lint-rt-"), { eco: "node", name: "alice.node.tool.eslint.airbnb" }));
  assert.ok(r.errors.some((e) => /runtime/.test(e)));
});

test("disallowed file, raw HTML, and http link are rejected", () => {
  const r = runLint(writePack(tmp("lint-bad-"), {
    skill: "# u\n\nSee http://x.com and <script>bad()</script>\n",
    extra: { "run.sh": "#!/bin/sh\n" },
  }));
  assert.ok(r.errors.some((e) => /disallowed file type/.test(e)), "run.sh");
  assert.ok(r.errors.some((e) => /raw HTML/.test(e)), "script tag");
  assert.ok(r.errors.some((e) => /http:\/\//.test(e)), "insecure link");
});

test("pack.yaml name must match the path", () => {
  const r = runLint(writePack(tmp("lint-nm-"), { name: "wrong.name.here.now" }));
  assert.ok(r.errors.some((e) => /does not match path-derived/.test(e)));
});

test("hidden zero-width character is rejected", () => {
  const r = runLint(writePack(tmp("lint-zw-"), { skill: "# u\n\nhid​den text\n" }));
  assert.ok(r.errors.some((e) => /hidden\/bidi/.test(e)));
});

test("engine-schema violation (wrong activate-when key) is rejected", () => {
  const r = runLint(writePack(tmp("lint-schema-"), {
    skillsYaml: "skills:\n  - file: skills/usage.md\n    activates-when:\n      files-present: [package.json]\n    scope: subtree\n",
  }));
  assert.equal(r.code, 1);
  assert.ok(r.errors.some((e) => /activate-when/.test(e)), r.errors.join("\n"));
});

test("missing registry.license is rejected", () => {
  const r = runLint(writePack(tmp("lint-reg-"), { registry: false }));
  assert.equal(r.code, 1);
  assert.ok(r.errors.some((e) => /registry/.test(e)), r.errors.join("\n"));
});
