import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) {
  throw new Error("Provide a kebab-case description: npm run db:create-migration -- create-auth-tables");
}
const folder = new URL("../../migrations/", import.meta.url);
await mkdir(folder, { recursive: true });
const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const target = new URL(`${timestamp}_${name}.sql`, folder);
await writeFile(target, `-- Migration: ${name}\n-- Transactions are managed by the migration runner.\n\n`, { flag: "wx" });
process.stdout.write(`Created ${fileURLToPath(target)}\n`);
