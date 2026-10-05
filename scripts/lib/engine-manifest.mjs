// Skillex 0.10.0's strict pack.yaml contract: internal/packs/pack.go.
// Registry naming, publication metadata, and content policy remain in lint-pack.
import { statSync } from "node:fs";
import { join, isAbsolute } from "node:path";

const SCOPES = new Set(["", "repo", "subtree", "directory", "matching-files", "nearest-ancestor", "boundary"]);
const DEPENDENCY = { source: "string", name: "string", version: "string" };
const ACTIVATION = {
  "files-present": ["string"], "files-matching": ["string"],
  "dependency-declared": [DEPENDENCY], detector: "string", all: "activation-list",
};
const SKILL = { file: "string", "activate-when": ACTIVATION, scope: "string", files: ["string"] };
const SERVER = {
  ref: "string", version: "string", relationship: "string",
  "activate-when": ACTIVATION, scope: "string", files: ["string"],
  capabilities: { prefer: ["string"] },
};
const MANIFEST = {
  name: "string", version: "string", description: "string", source: "string",
  skills: [SKILL], "mcp-servers": [SERVER], registry: "mapping",
  detectors: "detectors",
};
const DETECTOR = { matches: [{ file: { path: "string" }, dependency: DEPENDENCY }] };
const mapping = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value) => typeof value === "string" && value.trim() !== "";

function checkShape(value, schema, path, err, depth = 0) {
  // YAML null decodes as the Go field's zero value; semantic checks follow.
  if (value === null || value === undefined) return;
  if (depth > 80) { err(`${path} exceeds maximum schema nesting depth`); return; }
  if (schema === "string") {
    if (typeof value !== "string") err(`${path} must be a string`);
    return;
  }
  if (schema === "activation-list") schema = [ACTIVATION];
  if (Array.isArray(schema)) {
    if (!Array.isArray(value)) { err(`${path} must be a sequence`); return; }
    value.forEach((item, i) => checkShape(item, schema[0], `${path}[${i}]`, err, depth + 1));
    return;
  }
  if (!mapping(value)) { err(`${path} must be a mapping`); return; }
  if (schema === "mapping") return; // registry: is deliberately open metadata.
  if (schema === "detectors") {
    for (const [name, def] of Object.entries(value)) checkShape(def, DETECTOR, `${path}[${name}]`, err, depth + 1);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (!Object.hasOwn(schema, key)) err(`${path}.${key} is not supported by Skillex 0.10.0`);
    else checkShape(item, schema[key], `${path}.${key}`, err, depth + 1);
  }
}

function validateActivation(when, path, err, depth = 0) {
  if (depth > 32) { err(`${path} exceeds maximum activation nesting depth of 32`); return; }
  if (!mapping(when)) { err(`${path} must be a mapping`); return; }
  const hasLeaf = ["files-present", "files-matching", "dependency-declared"].some((key) =>
    Array.isArray(when[key]) && when[key].length > 0) || nonempty(when.detector);
  if (when.all !== undefined && when.all !== null) {
    if (!Array.isArray(when.all) || when.all.length === 0 || hasLeaf) {
      err(`${path}.all must contain at least one condition and cannot be combined with leaf fields`);
      return;
    }
    when.all.forEach((child, i) => validateActivation(child, `${path}.all[${i}]`, err, depth + 1));
  } else if (!hasLeaf) {
    err(`${path} must contain files-present, files-matching, dependency-declared, detector, or all`);
  }
}

function validateScope(value, path, err) {
  if (value !== undefined && value !== null && !SCOPES.has(value)) {
    err(`${path}.scope must be one of: ${[...SCOPES].filter(Boolean).join(", ")}`);
  }
}

export function validateEngineManifest(manifest, pack, err) {
  checkShape(manifest, MANIFEST, "pack.yaml", err);
  if (!mapping(manifest)) return;
  if (!nonempty(manifest.name)) err("pack.yaml name is required");
  const skills = Array.isArray(manifest.skills) ? manifest.skills : [];
  const servers = Array.isArray(manifest["mcp-servers"]) ? manifest["mcp-servers"] : [];
  if (skills.length === 0 && servers.length === 0) err("pack.yaml skills or mcp-servers must contain at least one entry");
  skills.forEach((skill, i) => {
    const path = `skills[${i}]`;
    if (!mapping(skill)) { err(`${path} must be a mapping`); return; }
    if (!nonempty(skill.file)) err(`${path}.file is required`);
    // Registry archives must also remain safe across POSIX and Windows.
    else if (isAbsolute(skill.file) || /^[A-Za-z]:/.test(skill.file) || skill.file.startsWith("\\") || skill.file.split(/[\\/]/).includes("..")) {
      err(`${path}.file must be a relative path inside the pack`);
    } else {
      try {
        if (!statSync(join(pack.dir, skill.file)).isFile()) err(`${path}.file must reference a regular file`);
      } catch { err(`${path}.file "${skill.file}" not found`); }
    }
    validateActivation(skill["activate-when"], `${path}.activate-when`, err);
    validateScope(skill.scope, path, err);
  });
  servers.forEach((server, i) => {
    const path = `mcp-servers[${i}]`;
    if (!mapping(server)) { err(`${path} must be a mapping`); return; }
    if (!nonempty(server.ref)) err(`${path}.ref is required`);
    if (!nonempty(server.version) || /[*<>=^~ ]/.test(server.version)) err(`${path}.version must be an exact version`);
    if (server.relationship !== "suggested") err(`${path}.relationship must be suggested`);
    validateActivation(server["activate-when"], `${path}.activate-when`, err);
    validateScope(server.scope, path, err);
    if (Array.isArray(server.capabilities?.prefer)) server.capabilities.prefer.forEach((name, j) => {
      if (!nonempty(name)) err(`${path}.capabilities.prefer[${j}] is required`);
    });
  });
  if (mapping(manifest.detectors)) for (const [name, def] of Object.entries(manifest.detectors)) {
    const path = `detectors[${name}]`;
    if (name.trim() === "") err("detector name is required");
    if (!Array.isArray(def?.matches) || def.matches.length === 0) {
      err(`${path}.matches must contain at least one entry`); continue;
    }
    def.matches.forEach((match, i) => {
      const mp = `${path}.matches[${i}]`;
      if (!mapping(match) || (!match.file && !match.dependency)) { err(`${mp} must contain file or dependency`); return; }
      if (match.file && !nonempty(match.file.path)) err(`${mp}.file.path is required`);
      if (match.dependency && !["source", "name", "version"].some((key) => nonempty(match.dependency[key]))) {
        err(`${mp}.dependency must contain source, name, or version`);
      }
    });
  }
}
