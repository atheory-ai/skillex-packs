import { readFileSync } from "node:fs";
import { join } from "node:path";
import { rcompare, valid } from "semver";

export const identity = ({ name, version }) => `${name}@${version}`;

export function indexVersions(entries) {
  const result = new Map();
  for (const entry of entries) {
    const key = identity(entry);
    if (result.has(key)) throw new Error(`duplicate catalog identity: ${key}`);
    result.set(key, entry);
  }
  return result;
}

export function retainedVersions(root, previous) {
  const declarations = JSON.parse(readFileSync(join(root, "registry/supported-versions.json"), "utf8"));
  if (!Array.isArray(declarations)) throw new Error("supported versions must be a JSON array");
  const retained = new Map();
  for (const entry of declarations) {
    if (!entry || typeof entry.name !== "string" || typeof entry.version !== "string" ||
        !/^\d/.test(entry.version) || !valid(entry.version) || entry.version.trim() !== entry.version ||
        Object.keys(entry).length !== 2) {
      throw new Error("expected a supported pack name and exact version");
    }
    const key = identity(entry);
    if (retained.has(key)) throw new Error(`duplicate supported version: ${key}`);
    if (!previous.has(key)) throw new Error(`supported version absent from the previous catalog: ${key}`);
    retained.set(key, previous.get(key));
  }
  return retained;
}

export function sortedVersions(entries) {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name, "en") ||
    rcompare(a.version, b.version) || a.version.localeCompare(b.version, "en"));
}
