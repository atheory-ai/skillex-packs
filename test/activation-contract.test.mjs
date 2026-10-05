import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { createProject, writeProjectFile, refresh, query, runSkillex } from "./helpers/skillex.mjs";

function manifest(skills, detectors) {
  return stringify({ name: "alice.javascript.tool.activation", version: "0.1.0", description: "Activation contract",
    registry: { license: "MIT" }, skills, detectors });
}
function guidance(name, topic) {
  return `---\nname: ${name}\ndescription: Contract guidance for ${name}.\ntopics: [${topic}]\n---\n\n# ${name}\n\nUse the documented workflow.\n`;
}
const names = (response) => (response.results ?? []).map((result) => result.name).sort();

test("nested all requires every file and detector gate; legacy leaves remain alternatives", (t) => {
  const skills = [
    { file: "all.md", scope: "repo", "activate-when": { all: [
      { detector: "javascript" }, { all: [{ detector: "service" }, { "files-matching": ["src/*.ts"] }] },
    ] } },
    { file: "or.md", scope: "repo", "activate-when": { detector: "service", "files-present": ["alternative.txt"] } },
  ];
  const project = createProject(t, {
    "skillex/pack.yaml": manifest(skills, { service: { matches: [{ file: { path: "service.config.json" } }] } }),
    "skillex/all.md": guidance("All gates", "activation-contract"),
    "skillex/or.md": guidance("Either gate", "activation-contract"),
    "alternative.txt": "alternate match\n",
  });
  const discover = () => { refresh(project); return query(project, ["--topic", "activation-contract"]); };
  assert.deepEqual(names(discover()), ["Either gate"]);
  writeProjectFile(project, "src/index.ts", "export {};\n");
  assert.deepEqual(names(discover()), ["Either gate"], "custom detector still false");
  writeProjectFile(project, "service.config.json", "{}\n");
  const both = discover();
  assert.deepEqual(names(both), ["All gates", "Either gate"]);
  const selected = both.results.find((result) => result.name === "All gates");
  const read = JSON.parse(runSkillex(project, ["read", "--ref", selected.ref, "--json"]).stdout);
  assert.match(read.content, /# All gates/);
  rmSync(join(project, "src/index.ts"));
  assert.deepEqual(names(discover()), ["Either gate"], "file gate became false");
  rmSync(join(project, "service.config.json"));
  rmSync(join(project, "alternative.txt"));
  assert.deepEqual(names(discover()), [], "neither alternative matches");
});

test("MCP-only pack suggestions require opt-in and matching gates, retain scopes, and do not configure servers", (t) => {
  const config = { Version: 5, Rules: [], MCP: { Enabled: true, Bindings: [{ Server: "io.github.example/search", Version: "1.2.3", Scope: "services/api/**" }] } };
  const project = createProject(t, {
    "skillex.json": JSON.stringify(config),
    "skillex/pack.yaml": stringify({ name: "alice.javascript.tool.suggestions", version: "0.1.0",
      description: "Suggestion contract", registry: { license: "MIT" }, "mcp-servers": [{
        ref: "io.github.example/search", version: "1.2.3", relationship: "suggested",
        "activate-when": { all: [{ detector: "javascript" }, { "files-present": ["services/api/marker.txt"] }] },
        scope: "subtree", capabilities: { prefer: ["contract.search"] },
      }] }),
    ".cursor/mcp.json": "{\"mcpServers\":{}}\n",
  });
  const discover = () => { refresh(project); return query(project, ["--mcp-server", "io.github.example/search"]); };
  assert.equal((discover().capabilities ?? []).length, 0);
  writeProjectFile(project, "services/api/marker.txt", "match\n");
  const response = discover();
  assert.equal(response.capability_returned_count, 1);
  assert.equal(response.capabilities[0].name, "contract.search");
  assert.equal(response.capabilities[0].availability, "setup-required", "a pack suggestion does not authorize a transport");
  assert.equal(query(project, ["--mcp-server", "io.github.example/search", "--path", "services/api/index.ts"]).capability_returned_count, 1);
  assert.equal((query(project, ["--mcp-server", "io.github.example/search", "--path", "outside.ts"]).capabilities ?? []).length, 0);
  assert.equal(readFileSync(join(project, ".cursor/mcp.json"), "utf8"), "{\"mcpServers\":{}}\n");
  assert.deepEqual(JSON.parse(readFileSync(join(project, "skillex.json"), "utf8")), config);
  writeProjectFile(project, "skillex.json", JSON.stringify({ ...config, MCP: { Enabled: false } }));
  assert.equal((discover().capabilities ?? []).length, 0, "disabled MCP hides suggestions");
  writeProjectFile(project, "skillex.json", JSON.stringify(config));
  rmSync(join(project, "services/api/marker.txt"));
  assert.equal((discover().capabilities ?? []).length, 0, "removed gate hides suggestions");
});

test("all seven scopes and explicit matching files survive refresh and path filtering", (t) => {
  const expected = {
    default: ["services/api/**"], repo: ["**"], subtree: ["services/api/**"],
    directory: ["services/api/*"], "matching-files": ["services/api/target.ts"],
    "nearest-ancestor": ["services/api/**"], boundary: ["**"],
  };
  const skills = Object.keys(expected).map((scope) => ({
    file: `${scope}.md`, scope: scope === "default" ? undefined : scope,
    "activate-when": { "files-present": ["services/api/marker.txt"] },
    files: scope === "matching-files" ? ["services/api/target.ts"] : undefined,
  }));
  const files = { "skillex/pack.yaml": manifest(skills), "services/api/marker.txt": "match\n",
    "services/api/target.ts": "export {};\n", "services/api/nested/child.ts": "export {};\n", "outside.ts": "export {};\n" };
  for (const scope of Object.keys(expected)) files[`skillex/${scope}.md`] = guidance(scope, "scope-contract");
  const project = createProject(t, files);
  refresh(project);
  const all = query(project, ["--topic", "scope-contract", "--limit", "20"]);
  assert.equal(all.returned_count, 7);
  for (const result of all.results) assert.deepEqual(result.scopes, expected[result.name], result.name);
  assert.deepEqual(names(query(project, ["--topic", "scope-contract", "--path", "outside.ts"])), ["boundary", "repo"]);
  assert.deepEqual(names(query(project, ["--topic", "scope-contract", "--path", "services/api/nested/child.ts"])),
    ["boundary", "default", "nearest-ancestor", "repo", "subtree"]);
  assert.deepEqual(names(query(project, ["--topic", "scope-contract", "--path", "services/api/target.ts", "--limit", "20"])), Object.keys(expected).sort());
});

test("declared dependency and dependency detector activate only in the matching workspace boundary", (t) => {
  const dependency = { source: "npm-package", name: "with-pack", version: "1.2.3" };
  const skills = [
    { file: "direct.md", scope: "boundary", "activate-when": { "dependency-declared": [dependency] } },
    { file: "detector.md", scope: "boundary", "activate-when": { detector: "dependency-contract" } },
    { file: "wrong.md", scope: "boundary", "activate-when": { "dependency-declared": [{ ...dependency, version: "9.9.9" }] } },
  ];
  const project = createProject(t, {
    "skillex.json": JSON.stringify({ Version: 4, Rules: [
      { Scope: "packages/app-a/**", DependencyBoundary: "packages/app-a" },
      { Scope: "packages/app-b/**", DependencyBoundary: "packages/app-b" },
    ] }),
    "package.json": JSON.stringify({ name: "workspace", private: true, workspaces: ["packages/*"] }),
    "packages/app-a/package.json": JSON.stringify({ name: "app-a", dependencies: { "with-pack": "1.2.3" } }),
    "packages/app-b/package.json": JSON.stringify({ name: "app-b" }),
    "packages/app-a/src/index.ts": "export {};\n", "packages/app-b/src/index.ts": "export {};\n",
    "node_modules/with-pack/package.json": JSON.stringify({ name: "with-pack", version: "1.2.3", skillex: true }),
    "node_modules/with-pack/skillex/pack.yaml": manifest(skills, { "dependency-contract": { matches: [{ dependency }] } }),
    "node_modules/with-pack/skillex/direct.md": guidance("Declared dependency", "dependency-contract"),
    "node_modules/with-pack/skillex/detector.md": guidance("Dependency detector", "dependency-contract"),
    "node_modules/with-pack/skillex/wrong.md": guidance("Wrong version", "dependency-contract"),
  });
  refresh(project);
  const response = query(project, ["--topic", "dependency-contract", "--path", "packages/app-a/src/index.ts"]);
  assert.deepEqual(names(response), ["Declared dependency", "Dependency detector"]);
  for (const result of response.results) {
    assert.equal(result.package, "with-pack");
    assert.deepEqual(result.scopes, ["packages/app-a/**"]);
  }
  assert.deepEqual(names(query(project, ["--topic", "dependency-contract", "--path", "packages/app-b/src/index.ts"])), []);
  writeProjectFile(project, "packages/app-a/package.json", JSON.stringify({ name: "app-a" }));
  refresh(project);
  assert.deepEqual(names(query(project, ["--topic", "dependency-contract"])), [], "removing dependency deactivates its guidance");
});
