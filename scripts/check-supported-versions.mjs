// Check publication against the target branch even if a bot proposal is stale.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { discoverPacks, readPackYaml } from "./lib/packs.mjs";
import { identity, indexVersions, retainedVersions } from "./lib/supported-versions.mjs";

const base = process.argv[2];
if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(base ?? "")) throw new Error("expected a base commit SHA");
const path = "registry/manifest.json";
const previous = execFileSync("git", ["show", `${base}:${path}`], { encoding: "utf8" });
const published = indexVersions(JSON.parse(previous).packs);
const retained = retainedVersions(".", published);
const candidate = readFileSync(path, "utf8");
if (candidate !== previous) {
  const proposed = indexVersions(JSON.parse(candidate).packs);
  const current = new Set(discoverPacks().map(pack => identity({name: pack.name, version: readPackYaml(pack.dir).version})));
  for (const key of [...retained.keys(), ...current]) {
    if (published.has(key) && !proposed.has(key)) throw new Error(`missing supported catalog entry: ${key}`);
  }
  for (const [key, entry] of proposed) {
    if (!retained.has(key) && !current.has(key)) throw new Error(`unexpected catalog entry: ${key}`);
    if (published.has(key) && !isDeepStrictEqual(entry, published.get(key))) {
      throw new Error(`changed published catalog entry: ${key}`);
    }
  }
}
