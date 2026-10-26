# Server implementation instructions

These are deliberate project instructions for every change inside this server repository. Follow the documents in `rules/` when building or modifying backend features. They were adopted from the legacy server; the local files are now the source of truth and must work without the legacy checkout.

## Read before implementation

Read all documents in `rules/general/` before the first implementation in a task. Then read the detailed documents relevant to the files being changed:

| Work | Local rule documents |
| --- | --- |
| Use cases and DTOs | `modules/application-rules.md` |
| Routes, controllers, Zod validation | `modules/presentation-rules.md` |
| Every route addition, path change, removal, or router mount change | `shared/route-path-rules.md` |
| Dependency wiring | `modules/factory-rules.md` |
| Repositories and SQL | `infrastructure/repositories-rules.md` |
| Third-party integrations | `infrastructure/external-services-rules.md` |
| Entities, enums, value objects | Corresponding files in `domain/` |
| Schema changes and seeds | `database/migration-rules.md` |
| Workers and job registration | `jobs/worker-rules.md` |
| Shared services and queues | `shared/services-rules.md`, plus `shared/queue-service-rules.md` for queues |
| Database service, connection config, pooling | `shared/database-service-rules.md` |
| Configuration, errors, middleware, type augmentation | Corresponding files in `shared/` |
| Every API addition, change, or removal | `shared/swagger-rules.md` |

All paths in this table are relative to `rules/`. Explicitly read the relevant documents; these are plain Markdown rules with no tool-specific metadata.

## Repository independence

- This is a fresh standalone server repository. Own all packages, lockfiles, source files, scripts, and configuration here.
- Never import code, load environment files, or resolve dependencies from `old-*` or sibling repositories. Legacy code may be read only as a behavioral reference.
- Create local `.env` configuration only when needed, ignore real environment files, and maintain a local `.env.example` with placeholders. Never copy legacy secrets.
- Only create files, folders, methods, dependencies, and services needed by the current authorized feature. Do not generate the entire example architecture upfront.

## Architecture baseline

- Use strict TypeScript targeting ES2022, native ESM (`"type": "module"`), and `NodeNext` for both modules and module resolution. Do not compile to CommonJS.
- Use `.js` extensions in relative imports, including type-only imports and explicit `/index.js` for directory entry points. Use `import type` for types and `import.meta.url` for module-relative paths. These rules also apply to illustrative import snippets in older rule documents.
- Keep domain code pure. Put SQL and provider calls in infrastructure; put business orchestration in use cases or workers.
- Feature flow: route -> factory-wired controller -> use case -> repository interface. Inject interfaces into use cases and workers; instantiate concrete infrastructure in module factories or the job registry.
- Use one request/response DTO file and one use case per operation. DTOs are classes with private constructors and `fromRequest`/`toResponse` factories. Keep controllers thin.
- Centralize environment parsing in `src/shared/config/index.ts`, validate with Zod at startup, and use structured logging without secrets.
- Update Swagger paths and schemas in the same change as the endpoint. Keep documentation consistent with the actual auth scheme, response format, and transport.

## Clarifications for legacy examples

These clarifications take precedence over conflicting summaries or illustrative snippets in the rule documents:

1. Transactions belong to use cases (or workers for async atomic work). Repository methods may accept an optional `PoolClient` as the final parameter; they never own transaction boundaries. Acquire one client, use it for every participating operation, rollback on failure, and always release it. Preserve the original failure if rollback also fails.
2. Add timestamps and soft delete according to the table's lifecycle. Do not force `deleted_at` onto every table. Filter active rows in repositories and use partial unique indexes when soft delete is selected.
3. Domain objects have no HTTP awareness. HTTP error primitives stay independent; the HTTP error handler may depend on the logger interface and validated configuration. Repositories still receive only `IDatabaseService` in their constructors.
4. Request DTOs may import the Express `Request` type for extraction; use cases must not accept Express request/response objects. Service types and repository row types may be imported where the detailed rules explicitly allow them.
5. Users, organizations, memberships, JWTs, auth providers, queues, and example methods are illustrations, not approved feature requirements. Do not create those features or select providers merely because examples mention them. Value objects have no identity; relationship-row IDs belong to persistence when needed.
6. Keep job contracts and worker code local if background processing is implemented here. The queue backend and deployment arrangement remain decisions for the relevant feature; do not create a separate repo or import a legacy worker. Queue adapters must actually enforce retryable versus non-retryable behavior, not merely log the distinction.
7. Use OpenAPI path templates such as `/users/{id}`, matching the real route and base path. Auth documentation must describe the scheme actually implemented, rather than assuming JWT bearer auth.
8. Prefer explicit rules over inconsistent example snippets. Create migrations through the local generator once initialized. Applied migrations are append-only; do not assume an existing database is disposable.

Human instructions in the current task take precedence over repository guidance. Record deliberate architectural changes here and update the corresponding rule documents so future work stays consistent.

## Better Auth integration boundary

- Google-only authentication is implemented by Better Auth. Its protocol routes in `modules/auth/presentation/auth.routes.ts` delegate directly to the library handler; no duplicate DTOs, controllers, password logic, JWT service, or repositories are needed for those routes.
- `infrastructure/auth/create-auth.ts` owns provider and adapter configuration. The shared `AuthService` is a deliberate integration facade allowed to import that factory and its inferred types. `server.ts` composes it with the existing managed PostgreSQL pool via `DatabaseService.getAuthPool()`; only DatabaseService closes that pool.
- Authentication uses database-backed cookie sessions. `AuthMiddleware.requireSession()` checks Better Auth sessions for application routes, rather than the JWT examples in older rules. Future application endpoints retain the normal controller/use-case/repository architecture.
- On success `requireSession()` sets `req.user = { userId }` (typed in `shared/@types/express.d.ts`, `AuthenticatedUser` in `shared/services/auth/auth.types.ts`); without a session it forwards `UnauthorizedError`. Request DTOs read the acting user only from `req.user`, never from the body, params or query.
- Better Auth owns validation and unwrapped responses under `/api/auth`. Its OpenAPI plugin provides the live auth contract at `/api/auth/open-api/generate-schema`; the application Swagger contract links to it instead of duplicating library endpoints. No email/password, account linking, or token retrieval APIs are exposed.
- SQL lives in `server/migrations/`, with scripts under `server/scripts/database/`. The runner owns migration transactions, checksums and an advisory lock. `schema_migrations` uses its migration filename as the natural primary key (exception to entity UUID IDs).
- Auth IDs are UUIDs generated in the application through Better Auth's `generateId` callback. This library boundary replaces the illustrative `IIdService` requirement; all auth timestamp columns use TIMESTAMPTZ.
- Local Google credentials were copied once from the legacy env at the user's explicit request. Runtime code must still read only the new server's own configuration, never legacy files.

## Application API conventions

- `express.json({ limit: "10kb" })` is mounted in `app.ts` after the Better Auth routes, which read their own request bodies. Keep it after them. Body-parser failures are mapped to 400 and 413 by `ErrorHandler`.
- Application IDs are UUIDv7 values (timestamp prefix plus random bits, generated with the pinned `uuid` package) from `IIdService` (`shared/services/id/`), injected into use cases. They fit the `UUID` column type, so no schema change is involved. Better Auth's own IDs still use `randomUUID()` in `create-auth.ts`.
- `ValidationMiddleware` returns the Zod issue messages to the client, so schemas must carry readable custom messages.
- Workspaces (`modules/workspaces`, routes under `/api/workspaces`) belong to one user through `workspaces.owner_id` (`ON DELETE CASCADE`, hard delete). Every query is scoped by the owner's id, and another user's workspace answers 404, exactly like a missing one. There are no membership or role tables yet; add them with the approved Team Collaboration or RBAC feature, backfilling from `owner_id`.

## Completion checks

- Once the TypeScript toolchain exists, run the local `npx tsc --noEmit` after code changes; it must pass with zero errors. Use only dependencies installed in this repo.
- Run relevant local build/tests for the behavior changed. Keep API docs and `.env.example` synchronized when applicable.
- If a check cannot run because the toolchain is not initialized, say so rather than borrowing another repo's tooling or claiming it passed.
- Stop every server or worker process started for testing, including on failure. Do not stop unrelated user-started processes.
