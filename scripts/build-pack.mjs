#!/usr/bin/env node
// build-pack.mjs — build ONE pack's deterministic tarball + SHA256.
// Used by the release workflow (.github/workflows/release-pack.yml) on a
// `pack/<name>/v<version>` tag. Output goes to registry/build/ (gitignored).
//
// Usage:
//   node scripts/build-pack.mjs <pack-name> [--json]
// Example:
//   node scripts/build-pack.mjs atheory-ai.javascript.tool.example --json

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverPacks, readPackYaml, relative, packFileEntries, tarballName,
  tarballUrl,
} from "./lib/packs.mjs";
import { buildTarGz } from "./lib/tar.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const name = args.find((a) => !a.startsWith("--"));

if (!name) {
  console.error("usage: build-pack.mjs <pack-name> [--json]");
  process.exit(2);
}

const pack = discoverPacks(root).find((p) => p.name === name);
if (!pack) {
  console.error(`build-pack: no pack named "${name}"`);
  process.exit(1);
}

const manifest = readPackYaml(pack.dir);
const version = String(manifest.version);
const { gz, sha256, size } = buildTarGz(packFileEntries(pack));

const dest = join(root, "registry/build/pack", pack.name, `v${version}`);
mkdirSync(dest, { recursive: true });
const file = join(dest, tarballName(pack.name, version));
writeFileSync(file, gz);
writeFileSync(`${file}.sha256`, `${sha256}  ${tarballName(pack.name, version)}\n`);

const result = {
  name: pack.name,
  version,
  tier: pack.tier,
  tarball: relative(root, file),
  sha256,
  size,
  url: tarballUrl(pack.name, version),
};

if (asJson) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} else {
  console.log(`build-pack: ${pack.name}@${version}`);
  console.log(`  tarball: ${result.tarball}`);
  console.log(`  sha256:  ${sha256}`);
  console.log(`  size:    ${size}B`);
}
