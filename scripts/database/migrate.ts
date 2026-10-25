import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { config } from "../../src/shared/config/index.js";
import { LoggerService } from "../../src/shared/services/logger/logger.service.js";

const logger = LoggerService.getInstance();
const pool = new pg.Pool({
  connectionString: config.database.migrationConnectionString,
  max: 1,
  connectionTimeoutMillis: config.database.connectionTimeoutMs,
  application_name: "ekam-migrations",
});
pool.on("error", error => logger.error("Migration connection failed", error));

async function run(): Promise<void> {
  let client: pg.PoolClient | undefined;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try { client = await pool.connect(); break; }
    catch (error) {
      if (attempt === 5) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }
  if (!client) throw new Error("Unable to connect for migrations");
  let locked = false;
  try {
    // Session-level lock requires a direct/session-pooled connection, not transaction pooling.
    await client.query("SELECT pg_advisory_lock(1785320194)");
    locked = true;
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const directoryIndex = process.argv.indexOf("--directory");
    const directory = directoryIndex >= 0 ? process.argv[directoryIndex + 1] : undefined;
    if (directoryIndex >= 0 && !directory) throw new Error("--directory requires a path");
    const folder = directory ? pathToFileURL(`${resolve(directory)}/`) : new URL("../../migrations/", import.meta.url);
    const files = (await readdir(folder)).filter(name => /^\d{14}_[a-z0-9-]+\.sql$/.test(name)).sort();
    const applied = await client.query<{ filename: string; checksum: string }>("SELECT filename, checksum FROM schema_migrations ORDER BY filename");
    const known = new Map(applied.rows.map(row => [row.filename, row.checksum]));
    for (const row of applied.rows) {
      if (!files.includes(row.filename)) throw new Error(`Applied migration file is missing: ${row.filename}`);
    }
    const statusOnly = process.argv.includes("--status");
    for (const filename of files) {
      const sql = await readFile(new URL(filename, folder), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      if (known.has(filename)) {
        if (known.get(filename) !== checksum) throw new Error(`Applied migration was changed: ${filename}`);
        if (statusOnly) logger.info("Migration applied", { filename });
        continue;
      }
      if (statusOnly) { logger.info("Migration pending", { filename }); continue; }
      const lastApplied = applied.rows.at(-1)?.filename;
      if (lastApplied && filename < lastApplied) throw new Error(`Migration is older than the latest applied file: ${filename}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)", [filename, checksum]);
        await client.query("COMMIT");
        logger.info("Migration completed", { filename });
      } catch (error) {
        try { await client.query("ROLLBACK"); }
        catch (rollbackError) { logger.error("Migration rollback failed", rollbackError); }
        throw error;
      }
    }
    logger.info(statusOnly ? "Migration status complete" : "Database is up to date");
  } finally {
    try { if (locked) await client.query("SELECT pg_advisory_unlock(1785320194)"); }
    finally { client.release(); }
  }
}

try { await run(); }
catch (error) { logger.error("Migration command failed", error); process.exitCode = 1; }
finally { await pool.end(); }
