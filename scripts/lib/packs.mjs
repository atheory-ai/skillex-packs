// Shared helpers for the skillex-packs registry tooling.
//
// Pack identity is handle-first and derived from the path:
//   ecosystems/<ecosystem>/packs/<handle>/<scope>.<name>[.<descriptor>]/
//     -> <handle>.<ecosystem>.<scope>.<name>[.<descriptor>]
// See .specs/01-naming-and-structure.md and .specs/04-canonical-vs-community.md.

import { readFileSync, readdirSync, statSync, lstatSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse as parseYaml } from "yaml";

export const REGISTRY = "atheory-ai/skillex-packs";
export const ECOSYSTEMS_DIR = "ecosystems";

// Files permitted inside a pack tarball (.specs/03-security.md). The
// allowlist governs what ships and is extracted on install.
export const ALLOWED_EXTENSIONS = new Set([".md", ".yaml", ".yml", ".json", ".txt"]);

// Repo-only governance files: allowed to live in the pack directory but
// NOT shipped in the tarball (build-manifest excludes them by extension),
// so they are exempt from the allowlist check.
export const REPO_ONLY_FILES = new Set(["OWNERS"]);

// The canonical owner, and handles nobody else may claim (.specs/01).
export const CANONICAL_HANDLE = "atheory-ai";
export const RESERVED_HANDLES = new Set([
  "atheory-ai", "core", "community", "official", "verified", "skillex", "std", "lang",
]);
// Handles explicitly granted the "official" tier (.specs/04). None yet.
export const OFFICIAL_HANDLES = new Set([]);

// The ecosystem segment is the LANGUAGE, never the runtime (.specs/01).
export const KNOWN_ECOSYSTEMS = new Set([
  "javascript", "python", "go", "rust", "ruby", "java", "kotlin", "scala",
  "csharp", "fsharp", "polyglot",
]);
// Tokens that are runtimes/platforms masquerading as ecosystems — rejected.
export const RUNTIME_TOKENS = new Set([
  "node", "nodejs", "bun", "deno", "dotnet", "jvm", "cpython", "v8",
]);

export const KNOWN_SCOPES = new Set([
  "lang", "runtime", "framework", "metaframework", "tool", "library", "pattern",
]);

// GitHub login rules: 1–39 chars, alphanumeric or single internal hyphens.
// Lowercased here because pack names are lowercase identifiers.
const HANDLE_RE = /^[a-z\d](?:-?[a-z\d])*$/;

export function isValidHandle(handle) {
  return handle.length >= 1 && handle.length <= 39 && HANDLE_RE.test(handle);
}

// Tier is DERIVED from the handle — never declared in pack.yaml (.specs/04).
export function deriveTier(handle) {
  if (handle === CANONICAL_HANDLE) return "core";
  if (OFFICIAL_HANDLES.has(handle)) return "official";
  return "community";
}

// Recursively list files under a directory (absolute-ish, relative to `root`).
export function listFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    // Node returns parentPath on the Dirent for recursive reads.
    const parent = entry.parentPath ?? entry.path ?? dir;
    if (entry.isFile() || entry.isSymbolicLink()) out.push(join(parent, entry.name));
  }
  return out;
}

// Discover every pack: any directory containing a pack.yaml under ecosystems/.
export function discoverPacks(rootDir = process.cwd()) {
  const base = join(rootDir, ECOSYSTEMS_DIR);
  let ecosystems;
  try {
    ecosystems = readdirSync(base, { withFileTypes: true });
  } catch {
    return []; // no ecosystems/ yet
  }
  const packs = [];
  for (const eco of ecosystems) {
    if (!eco.isDirectory()) continue;
    const packsDir = join(base, eco.name, "packs");
    let handles;
    try {
      handles = readdirSync(packsDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const handle of handles) {
      if (!handle.isDirectory()) continue;
      const handleDir = join(packsDir, handle.name);
      for (const leaf of readdirSync(handleDir, { withFileTypes: true })) {
        if (!leaf.isDirectory()) continue;
        const dir = join(handleDir, leaf.name);
        let hasManifest = false;
        try { hasManifest = statSync(join(dir, "pack.yaml")).isFile(); } catch { /* none */ }
        if (!hasManifest) continue;
        packs.push({
          dir,
          ecosystem: eco.name,
          handle: handle.name,
          leaf: leaf.name, // <scope>.<name>[.<descriptor>]
          name: `${handle.name}.${eco.name}.${leaf.name}`,
          tier: deriveTier(handle.name),
        });
      }
    }
  }
  return packs.sort((a, b) => a.name.localeCompare(b.name));
}

export function readPackYaml(packDir) {
  const raw = readFileSync(join(packDir, "pack.yaml"), "utf8");
  return parseYaml(raw);
}

export function hasSymlink(packDir) {
  for (const f of listFiles(packDir)) {
    if (lstatSync(f).isSymbolicLink()) return relative(packDir, f);
  }
  return null;
}

export function extOf(file) {
  const i = file.lastIndexOf(".");
  return i === -1 ? "" : file.slice(i).toLowerCase();
}

export { relative, sep };
