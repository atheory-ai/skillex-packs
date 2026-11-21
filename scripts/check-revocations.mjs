// Compare the reviewed input and any proposed publication with the target branch.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { readRevocations, requireRetained, validateRevocations } from "./lib/revocations.mjs";

const base = process.argv[2];
if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(base ?? "")) throw new Error("expected a base commit SHA");
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const source = readRevocations(".");
const ids = validateRevocations(source);
const catalogPath = "registry/manifest.json";
const previous = git("show", `${base}:${catalogPath}`);
requireRetained(ids, JSON.parse(previous).revocations);

// The source file first appears with the authoring feature. Once it exists,
// protect reviewed entries even between the source PR and publication.
if (git("ls-tree", "--name-only", base, "--", "registry/revocations.json").trim()) {
  requireRetained(ids, JSON.parse(git("show", `${base}:registry/revocations.json`)));
}
const proposed = readFileSync(catalogPath, "utf8");
if (proposed !== previous && !isDeepStrictEqual(JSON.parse(proposed).revocations, source)) {
  throw new Error("proposed manifest revocations differ from the reviewed source; rebuild on current main");
}
