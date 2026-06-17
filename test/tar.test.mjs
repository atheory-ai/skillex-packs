import { test } from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { buildTarGz } from "../scripts/lib/tar.mjs";

test("deterministic for identical input", () => {
  const entries = [{ path: "a.md", data: "A" }, { path: "b.md", data: "B" }];
  const r1 = buildTarGz(entries);
  const r2 = buildTarGz(entries);
  assert.equal(r1.sha256, r2.sha256);
  assert.equal(r1.size, r2.size);
  assert.match(r1.sha256, /^[a-f0-9]{64}$/);
});

test("entry order does not affect output (sorted internally)", () => {
  const a = buildTarGz([{ path: "a.md", data: "A" }, { path: "b.md", data: "B" }]);
  const b = buildTarGz([{ path: "b.md", data: "B" }, { path: "a.md", data: "A" }]);
  assert.equal(a.sha256, b.sha256);
});

test("content changes change the hash", () => {
  const a = buildTarGz([{ path: "a.md", data: "A" }]);
  const b = buildTarGz([{ path: "a.md", data: "A!" }]);
  assert.notEqual(a.sha256, b.sha256);
});

test("produces a valid gzip + USTAR archive", () => {
  const { gz } = buildTarGz([{ path: "x.txt", data: "hello" }]);
  const tar = gunzipSync(gz); // valid gzip or this throws
  assert.equal(tar.subarray(0, 5).toString(), "x.txt");        // name field
  assert.equal(tar.subarray(257, 262).toString(), "ustar");    // USTAR magic
  assert.equal(tar.subarray(512, 517).toString(), "hello");    // first data block
});

test("rejects paths too long for USTAR", () => {
  assert.throws(() => buildTarGz([{ path: "x/".repeat(60) + "f.md", data: "y" }]), /too long/);
});
