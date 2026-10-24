import pg from "pg";
import type { PoolClient, QueryResultRow } from "pg";
import type { ILoggerService } from "../logger/logger.service.interface.js";
import type { IDatabaseService } from "./database.service.interface.js";
import type { DatabaseOptions, QueryParams } from "./database.types.js";

const CONNECT_MAX_ATTEMPTS = 5;
const CONNECT_BASE_DELAY_MS = 500;
const CONNECT_MAX_DELAY_MS = 8_000;

export class DatabaseService implements IDatabaseService {
  private static instance: DatabaseService | undefined;

  private readonly pool: pg.Pool;
  private closing: Promise<void> | undefined;

  private constructor(
    private readonly logger: ILoggerService,
    options: DatabaseOptions,
  ) {
    this.pool = new pg.Pool({
      connectionString: options.connectionString,
      max: options.poolMax,
      connectionTimeoutMillis: options.connectionTimeoutMs,
      idleTimeoutMillis: options.idleTimeoutMs,
      // Stops a runaway query from holding a connection forever.
      statement_timeout: options.statementTimeoutMs,
      application_name: "ekam-server",
      // Keeps idle connections from being dropped silently by proxies and poolers.
      keepAlive: true,
    });

    // A hosted database closes idle connections (for example when it suspends).
    // Without this handler that event would crash the process; the pool discards the client instead.
    this.pool.on("error", error => {
      this.logger.error("Idle database connection failed", error);
    });
  }

  static getInstance(logger: ILoggerService, options: DatabaseOptions): DatabaseService {
    return (this.instance ??= new DatabaseService(logger, options));
  }

  async connect(): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.pool.query("SELECT 1");
        this.logger.info("Database connected", { attempt });
        return;
      } catch (error) {
        if (attempt >= CONNECT_MAX_ATTEMPTS) throw error;

        const delayMs = Math.min(CONNECT_BASE_DELAY_MS * 2 ** (attempt - 1), CONNECT_MAX_DELAY_MS);
        this.logger.error("Database connection failed, retrying", error, { attempt, retryInMs: delayMs });
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  async select<T extends QueryResultRow>(sql: string, params: QueryParams = []): Promise<T[]> {
    const result = await this.pool.query<T>(sql, [...params]);
    return result.rows;
  }

  async selectOne<T extends QueryResultRow>(sql: string, params: QueryParams = []): Promise<T | null> {
    const result = await this.pool.query<T>(sql, [...params]);
    return result.rows[0] ?? null;
  }

  async insert(sql: string, params: QueryParams = []): Promise<void> {
    await this.pool.query(sql, [...params]);
  }

  async execute(sql: string, params: QueryParams = []): Promise<number> {
    const result = await this.pool.query(sql, [...params]);
    return result.rowCount ?? 0;
  }

  getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  close(): Promise<void> {
    return (this.closing ??= this.pool.end());
  }
}
