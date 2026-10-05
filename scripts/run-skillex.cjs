#!/usr/bin/env node
// Run the pinned npm package's checksum-verified release binary. The 0.10.0
// launcher removes its executable on 'exit' with no retries, which can fail on
// Windows while file handles or antivirus scans are still releasing the file.
const { spawn } = require("node:child_process");
const { rm } = require("node:fs/promises");
const { dirname } = require("node:path");
const { prepareBinary } = require("@atheory-ai/skillex/bin/acquire");

(async () => {
  const { binary } = await prepareBinary();
  let outcome;
  try {
    const child = spawn(binary, process.argv.slice(2), { stdio: "inherit", windowsHide: true });
    const interrupt = () => child.kill("SIGINT");
    const terminate = () => child.kill("SIGTERM");
    process.on("SIGINT", interrupt);
    process.on("SIGTERM", terminate);
    try {
      outcome = await new Promise((resolve) => {
        let error;
        child.once("error", (cause) => { error = cause; });
        // 'close' follows 'exit' after the child's stdio handles have closed.
        child.once("close", (code, signal) => resolve({ code, signal, error }));
      });
    } finally {
      process.removeListener("SIGINT", interrupt);
      process.removeListener("SIGTERM", terminate);
    }
  } finally {
    await rm(dirname(binary), { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
  if (outcome.error) throw outcome.error;
  if (outcome.signal) process.kill(process.pid, outcome.signal);
  else process.exitCode = outcome.code ?? 1;
})().catch((error) => {
  process.stderr.write(`skillex: ${error.message}\n`);
  process.exitCode = 1;
});
