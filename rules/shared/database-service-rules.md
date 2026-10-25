# Database Service Rules

## Location

- `src/shared/services/database/` with `database.service.interface.ts`, `database.types.ts`, and `database.service.ts`.
- Built on the `pg` connection pool. `pg` and `@types/pg` are pinned to exact versions.

## Configuration

- The service receives a `DatabaseOptions` object from `config.database`. It never reads the environment.
- Two setups resolve to one `config.database.connectionString`:
  - `DATABASE_URL` for a hosted database (Neon in production).
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` for the local Docker database. Credentials are URL-encoded when the string is built.
- Setting both, setting neither, or leaving some `DB_*` values out fails startup. Error messages name variables only, never values.
- In production, `DATABASE_URL` must contain `sslmode=require`, `verify-ca`, or `verify-full`. Prefer `verify-full`.
- Pool tuning is optional with safe defaults: `DB_POOL_MAX` (10), `DB_CONNECTION_TIMEOUT_MS` (10000), `DB_IDLE_TIMEOUT_MS` (30000), `DB_STATEMENT_TIMEOUT_MS` (30000). Keep the pool small on a free hosted tier.

## Behavior

- `connect()` runs `SELECT 1` with up to 5 attempts and exponential backoff (500 ms to 8 s) so a suspended hosted database can wake up. `server.ts` calls it before listening and exits if it fails.
- The pool `error` event is always handled and logged. A hosted database closes idle connections, and an unhandled event would crash the process.
- `statement_timeout` is set on every connection so a runaway query cannot hold a connection forever.
- `close()` is idempotent. `server.ts` calls it after the HTTP server stops accepting requests.
- The service does not log query failures. The use case logs the original error and throws `InternalError`.

## Methods

`getAuthPool()` is also available on the concrete service for infrastructure composition in `server.ts` only. Better Auth shares this pool; it must not close it or create an unmanaged duplicate. Application repositories continue to use `IDatabaseService`.

Only these methods exist: `connect`, `select`, `selectOne`, `insert`, `execute` (returns affected rows), `getClient`, `close`. Add more only when a use case needs them. Always pass values as parameters (`$1`, `$2`), never by string interpolation.

## Transactions

Transactions belong to use cases. A use case calls `getClient()`, runs `BEGIN`, passes the client to repositories, rolls back on failure, and releases the client in a `finally` block.

## Neon notes

- Use the pooled connection string (host contains `-pooler`) for the running app. Use the direct connection string for migrations if session features are needed.
- The free tier suspends the database when idle. The first connection after a pause is slow, which is why `connect()` retries and the connection timeout is generous.
