# Ekam server

Standalone Express + TypeScript backend using native ESM. TypeScript targets ES2022 with NodeNext modules and resolution. Requires Node.js 22 or newer.

## Run locally

From this repository:

```bash
npm install
npm run dev
```

Create this repository's `.env` from `.env.example` before starting locally, then set `HOST`, `PORT`, and `NODE_ENV`. All three are required and validated at startup; there are no silent defaults. The example uses `http://127.0.0.1:5000`. Startup requires the configured PostgreSQL database and Google auth settings. The health endpoint itself remains a liveness check.

Local development/tests read only this server's `.env`, without overriding variables already set by the process. The file is optional when the process provides every required setting.

## Health check

```bash
curl http://127.0.0.1:5000/health
```

Returns HTTP 200 with:

```json
{"statusCode":200,"data":{"status":"ok"}}
```

This is a liveness check, not a database or external-service readiness check. The route lives in `src/modules/system/health.routes.ts`, using the flat system-module structure specified by the rules. Its OpenAPI contract is exported from `src/shared/services/swagger/swagger.config.ts`.

## Validation and production

```bash
npm run typecheck
npm run build
npm start
```

Use Ctrl+C to stop a local server. SIGINT and SIGTERM trigger graceful shutdown. Logging uses the local singleton `LoggerService`; `app.ts` receives its interface from `server.ts`.

Development uses `tsx watch` to execute TypeScript with automatic restarts. Production builds with `tsc` and starts the emitted ESM with plain Node.js and source maps; no bundler or runtime TypeScript loader is required in production.

Use `.js` extensions in relative TypeScript imports (including `/index.js` for directory entry points) so emitted imports work directly in Node.js. Use `import type` for types. Local configuration resolves the server-local `.env` with `import.meta.url` in both source and compiled code.

For production, set `NODE_ENV=production`, `HOST`, and `PORT` through your hosting service, container, or process manager before running `npm start`. Production skips the local `.env` entirely and fails startup if required settings are missing or invalid. Choose `HOST` for the deployment network; containers commonly require `0.0.0.0` rather than the local-development loopback address. Keep real `.env` files out of Git.

## Implementation rules

Read [AGENTS.md](AGENTS.md) before backend work. It defines how to load the local rules in [rules](rules), repository boundaries, and clarifications for legacy examples.

These are intentionally maintained project rules, not generated tool files. Keep them with this server repository so future feature work follows the same architecture in a standalone checkout.

No source code, packages, environment files, or services from the legacy repositories are required by this rules setup. Stop any agent-started server or worker after testing.

## Google-only authentication and migrations

Use the root `make start` to run pending migrations before the API starts. Migrations are SQL files in `migrations/`; `make migration name=description`, `make migrate`, and `make migration-status` run the server-owned tools in Docker. Inside this repo the equivalent npm scripts are `db:create-migration`, `db:migrate`, and `db:status`.

Configure `BETTER_AUTH_URL`, `CLIENT_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` using `.env.example`. Runtime reads only this server's configuration. Google redirects to `/api/auth/callback/google`. Email/password login, password reset, email change, account linking/unlinking and provider-token APIs are disabled. OAuth state is stored in `verifications`; no mail service is used.

Better Auth owns `/api/auth/*` and its native responses. Its generated contract is available at `/api/auth/open-api/generate-schema`, with a development reference UI at `/api/auth/reference`. The app Swagger metadata links to this contract. Profile updates, session listing/revocation, logout and fresh-session account deletion use the library APIs directly. Sessions last seven days, update daily, and are considered fresh for five minutes for sensitive operations. A missing/revoked/expired session is rejected by protected endpoints. Future application endpoints must apply `AuthMiddleware.requireSession()` explicitly.

Auth shares DatabaseService's managed pool and shutdown lifecycle. Generated UUID IDs and reviewed SQL use snake_case mappings and TIMESTAMPTZ. The migration runner owns transactions and a session-scoped advisory lock; hosted transaction pooling requires a direct/session-pooled `MIGRATION_DATABASE_URL`. Rate limits currently use process memory; multi-instance production needs shared rate-limit storage or an ingress limit.

Run `npm run typecheck:scripts` to check migration tooling alongside application sources. `tsx` executes TypeScript scripts without type checking, so this separate development check catches type errors before running migrations.

## Workspaces API

Every endpoint requires the Better Auth session cookie and only touches the signed-in user's own workspaces. Responses use the standard `{ statusCode, data }` envelope; errors use `{ statusCode, message }`.

| Method | Path | Result |
| --- | --- | --- |
| `POST` | `/api/workspaces` | Create a workspace from `{ "name": "..." }` (1-100 characters, trimmed). Returns 201 |
| `GET` | `/api/workspaces` | `{ workspaces: [...] }`, oldest first |
| `GET` | `/api/workspaces/{id}` | One workspace |
| `PATCH` | `/api/workspaces/{id}` | Rename with `{ "name": "..." }` |
| `DELETE` | `/api/workspaces/{id}` | Permanently delete; returns `{ id }` |

A workspace owned by someone else is reported as 404, the same as a missing one. Deleting a user account deletes their workspaces. The schema comes from the `create-workspaces-table` migration (`make migrate`). The contract is in `src/shared/services/swagger/docs/workspaces.docs.ts`.
