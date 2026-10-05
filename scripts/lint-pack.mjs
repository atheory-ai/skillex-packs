#!/usr/bin/env node
// lint-pack.mjs — the security / content / naming gate for registry packs.
// Implements the PR-time checks from .specs/03-security.md and the
// acceptance criteria from .specs/04-canonical-vs-community.md.
//
// Applies registry policy and the pinned Skillex engine manifest contract.
//
// Usage:
//   node scripts/lint-pack.mjs [--json] [pathToPack ...]
// With no path args, lints every discovered pack. Exits non-zero on any error.

import { readFileSync, statSync } from "node:fs";
import { validateEngineManifest } from "./lib/engine-manifest.mjs";
import { relative, basename, join } from "node:path";
import {
  discoverPacks, listFiles, readPackYaml, hasSymlink, extOf,
  ALLOWED_EXTENSIONS, REPO_ONLY_FILES, RESERVED_HANDLES, CANONICAL_HANDLE,
  KNOWN_ECOSYSTEMS, RUNTIME_TOKENS, KNOWN_SCOPES, isValidHandle,
} from "./lib/packs.mjs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const pathArgs = args.filter((a) => !a.startsWith("--"));

// Invisible / bidi characters that hide content from a human reviewer.
const DANGEROUS_CHARS = [
  ["U+200B", /​/], ["U+200C", /‌/], ["U+200D", /‍/],
  ["U+2060", /⁠/], ["U+FEFF", /﻿/],
  ["RTL/LTR override", /[‪-‮⁦-⁩]/],
];
const RAW_HTML = /<\s*(script|iframe|object|embed|style|link|meta)\b/i;
const URL_RE = /\bhttps?:\/\/[^\s)\]}"'<>]+/gi;
const INJECTION_PHRASES = [
  /ignore (all )?previous instructions/i,
  /disregard (the )?(above|previous)/i,
  /\bsystem:\s/i,
  /<\|(im_start|im_end|assistant|system|user)\|>/i,
  /\bas an? (ai|assistant|language model)\b/i,
  /you are now\b/i,
];
const TEXT_EXTS = new Set([".md", ".txt", ".yaml", ".yml", ".json"]);
const REQUIRED_YAML_FIELDS = ["name", "version", "description"]; // engine fields; license is under registry:

function lintPack(pack, sink) {
  const err = (msg) => sink.errors.push(`${pack.name}: ${msg}`);
  const warn = (msg) => sink.warnings.push(`${pack.name}: ${msg}`);

  // --- naming / path identity ---
  const { handle, ecosystem, leaf } = pack;
  if (!isValidHandle(handle)) {
    err(`handle "${handle}" is not a valid GitHub login (lowercase alphanumeric + single hyphens)`);
  }
  if (RESERVED_HANDLES.has(handle) && handle !== CANONICAL_HANDLE) {
    err(`handle "${handle}" is reserved and cannot be used as an owner`);
  }
  if (RUNTIME_TOKENS.has(ecosystem)) {
    err(`ecosystem "${ecosystem}" is a runtime, not a language — name the language (e.g. javascript) and express the runtime via compatibility/runtime-scope`);
  } else if (!KNOWN_ECOSYSTEMS.has(ecosystem)) {
    warn(`ecosystem "${ecosystem}" is not in the known-languages list — confirm it is a language, not a runtime`);
  }
  const scope = leaf.split(".")[0];
  if (!KNOWN_SCOPES.has(scope)) {
    err(`scope "${scope}" (from "${leaf}") is not one of ${[...KNOWN_SCOPES].join(", ")}`);
  }

  // --- no symlinks ---
  const sym = hasSymlink(pack.dir);
  if (sym) err(`contains a symlink (${sym}); not allowed in a pack`);

  // --- pack.yaml presence / fields / name match ---
  let manifest;
  try {
    manifest = readPackYaml(pack.dir);
  } catch (e) {
    err(`pack.yaml does not parse: ${e.message}`);
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    err("pack.yaml must contain a manifest mapping");
  } else {
    for (const f of REQUIRED_YAML_FIELDS) {
      if (manifest[f] === undefined || manifest[f] === null || manifest[f] === "") {
        err(`pack.yaml missing required field "${f}"`);
      }
    }
    if (manifest.name && manifest.name !== pack.name) {
      err(`pack.yaml name "${manifest.name}" does not match path-derived name "${pack.name}"`);
    }
    if (manifest.tier !== undefined) {
      warn(`pack.yaml declares "tier" — tier is derived from the handle and must not be declared`);
    }
    // Registry-only metadata block (engine ignores it; the registry needs it).
    const reg = manifest.registry;
    if (!reg || typeof reg !== "object" || Array.isArray(reg)) {
      err(`pack.yaml is missing the "registry:" metadata block (license, authors, …)`);
    } else if (!reg.license) {
      err(`pack.yaml registry.license is required`);
    }
    // Engine manifest schema.
    validateEngineManifest(manifest, pack, err);
  }

  // --- per-file checks ---
  let injectionHits = 0;
  for (const file of listFiles(pack.dir)) {
    const rel = relative(pack.dir, file);
    const ext = extOf(file);
    if (REPO_ONLY_FILES.has(basename(file))) continue; // repo-only, not shipped
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      err(`disallowed file type: ${rel} (allowed: ${[...ALLOWED_EXTENSIONS].join(", ")})`);
      continue;
    }
    if (!TEXT_EXTS.has(ext)) continue;
    if (statSync(file).size > 512 * 1024) { warn(`${rel}: unusually large (>512KB) for a text skill`); }
    const text = readFileSync(file, "utf8");

    for (const [label, re] of DANGEROUS_CHARS) {
      if (re.test(text)) err(`${rel}: contains hidden/bidi character (${label})`);
    }
    if (ext === ".md") {
      if (RAW_HTML.test(text)) err(`${rel}: contains raw HTML (script/iframe/etc.) — not allowed in skill content`);
      for (const phrase of INJECTION_PHRASES) {
        if (phrase.test(text)) injectionHits++;
      }
    }
    for (const m of text.matchAll(URL_RE)) {
      const url = m[0];
      if (url.toLowerCase().startsWith("http://")) err(`${rel}: insecure http:// link (${url}) — use https://`);
      if (/\/\/[^/\s]*xn--/i.test(url)) err(`${rel}: IDN/punycode host in link (${url}) — use a plain ASCII https URL`);
    }
  }
  if (injectionHits > 0) {
    warn(`${injectionHits} possible prompt-injection phrase(s) in skill content — a human reviewer must check`);
  }

  // --- conventional files (advisory) ---
  for (const f of ["README.md", "OWNERS", "CHANGELOG.md"]) {
    try { statSync(`${pack.dir}/${f}`); } catch { warn(`missing ${f}`); }
  }
}

function main() {
  let packs = discoverPacks();
  if (pathArgs.length) {
    const wanted = pathArgs.map((p) => p.replace(/\/+$/, ""));
    packs = packs.filter((p) => wanted.some((w) => p.dir.endsWith(w) || p.name === w));
  }

  const sink = { errors: [], warnings: [] };
  for (const pack of packs) lintPack(pack, sink);

  if (asJson) {
    process.stdout.write(JSON.stringify({ packs: packs.length, ...sink }, null, 2) + "\n");
  } else {
    console.log(`lint-pack: ${packs.length} pack(s)`);
    for (const w of sink.warnings) console.log(`  ! ${w}`);
    for (const e of sink.errors) console.log(`  ✗ ${e}`);
    console.log(`\n${sink.errors.length} error(s), ${sink.warnings.length} warning(s)`);
  }
  process.exit(sink.errors.length ? 1 : 0);
}

main();
