// Values come from config.database; the service never reads the environment itself.
export type DatabaseOptions = {
  connectionString: string;
  poolMax: number;
  connectionTimeoutMs: number;
  idleTimeoutMs: number;
  statementTimeoutMs: number;
};

// Query parameters are always passed separately from the SQL text ($1, $2, ...).
export type QueryParams = readonly unknown[];
