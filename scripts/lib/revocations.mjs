import { readFileSync } from "node:fs";
import { join } from "node:path";
import { valid } from "semver";
import { isValidHandle } from "./packs.mjs";

export function validateRevocations(entries) {
  if (!Array.isArray(entries)) throw new Error("revocations must be a JSON array");
  const identities = new Set();
  for (const [index, entry] of entries.entries()) {
    const { name, version, reason } = entry ?? {};
    const segments = typeof name === "string" ? name.split(".") : [];
    if (segments.length < 4 || !isValidHandle(segments[0]) ||
        !segments.every((s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) {
      throw new Error(`revocations[${index}]: expected a fully qualified pack name`);
    }
    if (typeof version !== "string" || !/^[0-9]/.test(version) || version.trim() !== version || !valid(version)) {
      throw new Error(`${name}: expected an exact SemVer version`);
    }
    const id = `${name}@${version}`;
    for (const field of Object.keys(entry)) {
      if (!["name", "version", "reason", "revokedAt"].includes(field)) throw new Error(`${id}: unknown field ${field}`);
    }
    if ("revokedAt" in entry && (typeof entry.revokedAt !== "string" || !Number.isFinite(Date.parse(entry.revokedAt)))) {
      throw new Error(`${id}: invalid revokedAt timestamp`);
    }
    if (typeof reason !== "string" || !reason.trim()) throw new Error(`${id}: expected a public reason`);
    if (identities.has(id)) throw new Error(`duplicate revocation for ${id}`);
    identities.add(id);
  }
  return identities;
}

// Match identities even when the version is absent from the current pack tree.
export function requireRetained(current, previous) {
  for (const id of validateRevocations(previous)) {
    if (!current.has(id)) throw new Error(`removed revocation for ${id}`);
  }
}

export function readRevocations(root) {
  const read = (file) => JSON.parse(readFileSync(join(root, "registry", file), "utf8"));
  const entries = read("revocations.json");
  requireRetained(validateRevocations(entries), read("manifest.json").revocations);
  return entries;
}
