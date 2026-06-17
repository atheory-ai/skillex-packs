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

import { mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  discoverPacks, readPackYaml, relative, packFileEntries,
  tarballName, tarballUrl, REGISTRY,
} from "./lib/packs.mjs";
import { buildTarGz } from "./lib/tar.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
// --from-releases: source each SHA256 from the PUBLISHED release asset (CI,
// authoritative) instead of rebuilding the tarball locally (dev/structure).
const fromReleases = args.includes("--from-releases");
const outArg = args.indexOf("--out");
const outPath = join(root, outArg !== -1 ? args[outArg + 1] : "registry/manifest.json");
const buildDir = join(root, "registry/build");

// Authoritative: hash the PUBLISHED release asset, so the manifest provably
// matches exactly what a consumer downloads (no rebuild-determinism needed).
// Returns null when the pack's current version has no release yet.
function digestFromRelease(pack, version) {
  const tag = `pack/${pack.name}/v${version}`;
  const asset = tarballName(pack.name, version);
  try {
    execFileSync("gh", ["release", "view", tag, "--json", "tagName"], { stdio: "pipe" });
  } catch {
    return null; // not released
  }
  const tmp = mkdtempSync(join(tmpdir(), "skillex-manifest-"));
  try {
    execFileSync("gh", ["release", "download", tag, "--pattern", asset, "--dir", tmp], { stdio: "pipe" });
    const buf = readFileSync(join(tmp, asset));
    return { sha256: createHash("sha256").update(buf).digest("hex"), size: buf.length };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Dev/structure only: rebuild the tarball locally. SHAs are NOT authoritative
// across machines (gzip depends on the zlib/Node version) — CI is the source
// of truth via --from-releases.
function digestFromRebuild(pack, version) {
  const { gz, sha256, size } = buildTarGz(packFileEntries(pack));
  if (!checkOnly) {
    const dest = join(buildDir, "pack", pack.name, `v${version}`);
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, tarballName(pack.name, version)), gz);
    writeFileSync(join(dest, `${tarballName(pack.name, version)}.sha256`), `${sha256}  ${tarballName(pack.name, version)}\n`);
  }
  return { sha256, size };
}

function packEntry(pack) {
  const manifest = readPackYaml(pack.dir);
  const version = String(manifest.version);

  const digest = fromReleases ? digestFromRelease(pack, version) : digestFromRebuild(pack, version);
  if (!digest) {
    console.warn(`  ! ${pack.name}@${version}: no published release yet — skipped`);
    return null;
  }
  const { sha256, size } = digest;

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
    packs: packs.map(packEntry).filter(Boolean),
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
