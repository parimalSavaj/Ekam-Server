import type { PoolClient, QueryResultRow } from "pg";
import type { QueryParams } from "./database.types.js";

export interface IDatabaseService {
  /** Verifies the database is reachable, retrying while a hosted database wakes up. */
  connect(): Promise<void>;
  select<T extends QueryResultRow>(sql: string, params?: QueryParams): Promise<T[]>;
  selectOne<T extends QueryResultRow>(sql: string, params?: QueryParams): Promise<T | null>;
  insert(sql: string, params?: QueryParams): Promise<void>;
  /** Runs an UPDATE or DELETE and returns the number of affected rows. */
  execute(sql: string, params?: QueryParams): Promise<number>;
  /** Acquires a client for a transaction. The caller must always call client.release(). */
  getClient(): Promise<PoolClient>;
  /** Waits for in-flight queries and closes every connection. Safe to call more than once. */
  close(): Promise<void>;
}
