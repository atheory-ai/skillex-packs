// Deterministic tar.gz builder (USTAR) + SHA256, dependency-free.
//
// Determinism (.specs/05-distribution.md "Builds a deterministic tarball"):
//   - entries sorted by path
//   - mtime = 0, uid/gid = 0, fixed mode, empty uname/gname
//   - gzip with a zeroed mtime header
// The same inputs always produce byte-identical output, so the SHA256 is
// stable across machines and CI.

import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const BLOCK = 512;

function octal(value, width) {
  // width includes the trailing NUL; field is `width-1` octal digits + NUL.
  return value.toString(8).padStart(width - 1, "0") + "\0";
}

function header(name, size, { mode = 0o644 } = {}) {
  if (Buffer.byteLength(name) > 100) {
    throw new Error(`tar: path too long for USTAR (>100 bytes): ${name}`);
  }
  const buf = Buffer.alloc(BLOCK, 0);
  buf.write(name, 0, "utf8"); // name[100]
  buf.write(octal(mode & 0o7777, 8), 100, "ascii"); // mode[8]
  buf.write(octal(0, 8), 108, "ascii"); // uid[8]
  buf.write(octal(0, 8), 116, "ascii"); // gid[8]
  buf.write(octal(size, 12), 124, "ascii"); // size[12]
  buf.write(octal(0, 12), 136, "ascii"); // mtime[12] = 0
  buf.write("        ", 148, "ascii"); // chksum[8] spaces while computing
  buf.write("0", 156, "ascii"); // typeflag = regular file
  buf.write("ustar\0", 257, "ascii"); // magic[6]
  buf.write("00", 263, "ascii"); // version[2]
  // uname/gname/dev*/prefix left as zeros.

  let sum = 0;
  for (let i = 0; i < BLOCK; i++) sum += buf[i];
  buf.write(octal(sum, 7), 148, "ascii"); // 6 octal digits + NUL ...
  buf.write(" ", 155, "ascii"); // ... followed by a space
  return buf;
}

function pad512(buf) {
  const rem = buf.length % BLOCK;
  return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(BLOCK - rem, 0)]);
}

// entries: [{ path, data: Buffer|string }]
export function buildTarGz(entries) {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const chunks = [];
  for (const e of sorted) {
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(e.data, "utf8");
    chunks.push(header(e.path, data.length));
    chunks.push(pad512(data));
  }
  chunks.push(Buffer.alloc(BLOCK * 2, 0)); // two zero blocks = end of archive
  const tar = Buffer.concat(chunks);
  const gz = gzipSync(tar, { level: 9, mtime: 0 });
  const sha256 = createHash("sha256").update(gz).digest("hex");
  return { gz, sha256, size: gz.length };
}
