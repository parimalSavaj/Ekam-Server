# Server implementation instructions

These are deliberate project instructions for every change inside this server repository. Follow the documents in `rules/` when building or modifying backend features. They were adopted from the legacy server; the local files are now the source of truth and must work without the legacy checkout.

## Read before implementation

Read all documents in `rules/general/` before the first implementation in a task. Then read the detailed documents relevant to the files being changed:

| Work | Local rule documents |
| --- | --- |
| Use cases and DTOs | `modules/application-rules.md` |
| Routes, controllers, Zod validation | `modules/presentation-rules.md` |
| Dependency wiring | `modules/factory-rules.md` |
| Repositories and SQL | `infrastructure/repositories-rules.md` |
| Third-party integrations | `infrastructure/external-services-rules.md` |
| Entities, enums, value objects | Corresponding files in `domain/` |
| Schema changes and seeds | `database/migration-rules.md` |
| Workers and job registration | `jobs/worker-rules.md` |
| Shared services and queues | `shared/services-rules.md`, plus `shared/queue-service-rules.md` for queues |
| Configuration, errors, middleware, type augmentation | Corresponding files in `shared/` |
| Every API addition, change, or removal | `shared/swagger-rules.md` |

All paths in this table are relative to `rules/`. Explicitly read the relevant documents; these are plain Markdown rules with no tool-specific metadata.

## Repository independence

- This is a fresh standalone server repository. Own all packages, lockfiles, source files, scripts, and configuration here.
- Never import code, load environment files, or resolve dependencies from `old-*` or sibling repositories. Legacy code may be read only as a behavioral reference.
- Create local `.env` configuration only when needed, ignore real environment files, and maintain a local `.env.example` with placeholders. Never copy legacy secrets.
- Only create files, folders, methods, dependencies, and services needed by the current authorized feature. Do not generate the entire example architecture upfront.

## Architecture baseline

- Use strict TypeScript, no `any`, ES import/export syntax with CommonJS compilation as specified in the general rules. Configure a compatible local runtime/build toolchain when the server is initialized.
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

## Completion checks

- Once the TypeScript toolchain exists, run the local `npx tsc --noEmit` after code changes; it must pass with zero errors. Use only dependencies installed in this repo.
- Run relevant local build/tests for the behavior changed. Keep API docs and `.env.example` synchronized when applicable.
- If a check cannot run because the toolchain is not initialized, say so rather than borrowing another repo's tooling or claiming it passed.
- Stop every server or worker process started for testing, including on failure. Do not stop unrelated user-started processes.
