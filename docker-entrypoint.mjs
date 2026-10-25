// Refresh persistent dependency volumes when the bind-mounted lockfile changes.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

const marker = "node_modules/.ekam-lock-hash";
const hash = createHash("sha256").update(readFileSync("package-lock.json")).digest("hex");
if (!existsSync(marker) || readFileSync(marker, "utf8").trim() !== hash) {
  const installed = spawnSync("npm", ["ci", "--no-audit", "--no-fund"], { stdio: "inherit" });
  if (installed.status !== 0) process.exit(installed.status ?? 1);
  writeFileSync(marker, hash);
}
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error("Container command is required");
const child = spawn(command, args, { stdio: "inherit" });
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
child.on("error", error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal === "SIGINT" ? 130 : 143); });
