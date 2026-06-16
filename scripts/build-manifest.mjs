#!/usr/bin/env node
// build-manifest.mjs — assemble registry/manifest.json from the packs.
// Produces the manifest format in .specs/05-distribution.md: each entry has
// the path-derived name, the handle, the DERIVED tier, version, compatibility,
// and a deterministic tarball {url, sha256, size}.
//
// The tarballs themselves are written to registry/build/ (gitignored) so the
// SHA256 in the manifest is real and verifiable. The cosign signing and the
// GitHub Release upload are the release workflow's job (not done here).
//
// Usage: node scripts/build-manifest.mjs [--out registry/manifest.json] [--check]
//   --check : build in memory and fail if registry/manifest.json is stale.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverPacks, readPackYaml, relative, packFileEntries,
  tarballName, tarballUrl, REGISTRY,
} from "./lib/packs.mjs";
import { buildTarGz } from "./lib/tar.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const outArg = args.indexOf("--out");
const outPath = join(root, outArg !== -1 ? args[outArg + 1] : "registry/manifest.json");
const buildDir = join(root, "registry/build");

function packEntry(pack) {
  const manifest = readPackYaml(pack.dir);
  const version = String(manifest.version);

  // Deterministic tarball of the pack's shippable files.
  const { gz, sha256, size } = buildTarGz(packFileEntries(pack));

  if (!checkOnly) {
    const dest = join(buildDir, "pack", pack.name, `v${version}`);
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, tarballName(pack.name, version)), gz);
    writeFileSync(join(dest, tarballName(pack.name, version) + ".sha256"), `${sha256}  ${tarballName(pack.name, version)}\n`);
  }

  const entry = {
    name: pack.name,
    handle: pack.handle,
    tier: pack.tier, // derived from the handle
    version,
    description: manifest.description ?? "",
    homepage: manifest.homepage ??
      `https://github.com/${REGISTRY}/tree/main/ecosystems/${pack.ecosystem}/packs/${pack.handle}/${pack.leaf}`,
    license: manifest.license ?? "",
    authors: manifest.authors ?? [pack.handle],
    compatibility: manifest.compatibility ?? {},
    tarball: { url: tarballUrl(pack.name, version), sha256, size },
  };
  if (manifest.replaces) entry.replaces = manifest.replaces;
  if (manifest["superseded-by"]) entry["superseded-by"] = manifest["superseded-by"];
  return entry;
}

function build() {
  const packs = discoverPacks(root);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    registry: REGISTRY,
    packs: packs.map(packEntry),
    revocations: [],
  };
}

function stableStringify(manifest) {
  // generatedAt is volatile; everything else is deterministic.
  return JSON.stringify(manifest, null, 2) + "\n";
}

function main() {
  const manifest = build();

  if (checkOnly) {
    let current;
    try { current = readFileSync(outPath, "utf8"); } catch { current = null; }
    const a = current && JSON.parse(current);
    const fresh = { ...manifest };
    // Compare everything except generatedAt.
    const norm = (m) => JSON.stringify({ ...m, generatedAt: "" });
    if (!a || norm(a) !== norm(fresh)) {
      console.error("manifest is stale — run `npm run build:manifest`");
      process.exit(1);
    }
    console.log("manifest is up to date");
    return;
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, stableStringify(manifest));
  console.log(`build-manifest: ${manifest.packs.length} pack(s) -> ${relative(root, outPath)}`);
  for (const p of manifest.packs) {
    console.log(`  [${p.tier}] ${p.name}@${p.version}  ${p.tarball.sha256.slice(0, 12)}…  ${p.tarball.size}B`);
  }
}

main();
