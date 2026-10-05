import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { stringify } from "yaml";
import { createProject, ROOT, runSkillex } from "./helpers/skillex.mjs";

const skill = () => ({ file: "usage.md", "activate-when": { "files-present": ["package.json"] }, scope: "repo" });
const server = () => ({ ref: "io.github.example/search", version: "1.2.3", relationship: "suggested",
  "activate-when": { all: [{ detector: "javascript" }, { "files-present": ["package.json"] }] },
  scope: "repo", capabilities: { prefer: ["search"] } });
const manifest = () => ({ name: "alice.javascript.tool.contract", version: "0.1.0", description: "Contract fixture",
  registry: { license: "MIT", "future-metadata": true }, skills: [skill()] });

const cases = [
  ["skill-only with open registry metadata", true, () => manifest()],
  ["MCP-only with composed activation", true, () => ({ ...manifest(), skills: undefined, "mcp-servers": [server()] })],
  ["mixed skills and MCP", true, () => ({ ...manifest(), "mcp-servers": [server()] })],
  ["empty pack", false, () => ({ ...manifest(), skills: [] })],
  ["unknown top-level field", false, () => ({ ...manifest(), activation: {} })],
  ["unknown skill field", false, () => ({ ...manifest(), skills: [{ ...skill(), transport: "stdio" }] })],
  ["unknown activation field", false, () => ({ ...manifest(), skills: [{ ...skill(), "activate-when": { ...skill()["activate-when"], typo: true } }] })],
  ["wrong activation type", false, () => ({ ...manifest(), skills: [{ ...skill(), "activate-when": { "files-present": "package.json" } }] })],
  ["invalid skill scope", false, () => ({ ...manifest(), skills: [{ ...skill(), scope: "everywhere" }] })],
  ["unknown detector field", false, () => ({ ...manifest(), detectors: { custom: { matches: [{ file: { path: "package.json", typo: true } }] } } })],
  ["empty detector dependency", false, () => ({ ...manifest(), detectors: { custom: { matches: [{ dependency: {} }] } } })],
  ["MCP execution configuration", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), command: "node" }] })],
  ["MCP auth configuration", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), env: { TOKEN: "placeholder" } }] })],
  ["MCP version range", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), version: "^1.2.3" }] })],
  ["MCP relationship", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), relationship: "required" }] })],
  ["MCP invalid scope", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), scope: "everywhere" }] })],
  ["MCP empty capability", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), capabilities: { prefer: [" "] } }] })],
  ["MCP unknown capability field", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), capabilities: { require: ["search"] } }] })],
  ["MCP mixed all and leaf activation", false, () => ({ ...manifest(), "mcp-servers": [{ ...server(), "activate-when": { all: [{ detector: "javascript" }], detector: "javascript" } }] })],
];

for (const [name, valid, build] of cases) test(`registry and released 0.10 loader agree: ${name}`, (t) => {
  const yaml = stringify(build());
  const project = createProject(t, {
    "skillex/pack.yaml": yaml, "skillex/usage.md": "# Usage\n\nContract fixture.\n",
    "ecosystems/javascript/packs/alice/tool.contract/pack.yaml": yaml,
    "ecosystems/javascript/packs/alice/tool.contract/usage.md": "# Usage\n\nContract fixture.\n",
  });
  const lint = spawnSync(process.execPath, [join(ROOT, "scripts/lint-pack.mjs"), "--json"], {
    cwd: project, encoding: "utf8", timeout: 60_000,
  });
  assert.ifError(lint.error);
  const report = JSON.parse(lint.stdout);
  assert.equal(lint.status, valid ? 0 : 1, report.errors.join("\n"));
  const load = runSkillex(project, ["refresh"]);
  const output = `${load.stdout}\n${load.stderr}`;
  if (valid) assert.doesNotMatch(output, /Warnings:|parsing .*pack\.yaml|invalid pack/);
  else assert.match(output, /Warnings:|parsing .*pack\.yaml|invalid pack/, output);
});
