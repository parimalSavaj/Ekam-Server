# Folder Structure Rules

## Project Layout

```
src/
├── shared/                        # Cross-cutting concerns used across the entire app
│   ├── @types/                    # Type augmentations for third-party libraries (.d.ts files)
│   ├── config/                    # App configuration (env vars, constants)
│   ├── constants/                 # Shared constants (route prefixes, status codes)
│   ├── services/                  # Shared services — one folder per service (co-located)
│   │   ├── logger/
│   │   │   ├── logger.service.interface.ts
│   │   │   └── logger.service.ts
│   │   ├── database/
│   │   │   ├── database.service.interface.ts
│   │   │   ├── database.types.ts
│   │   │   └── database.service.ts
│   │   ├── queue/
│   │   │   ├── queue.service.interface.ts
│   │   │   ├── queue.types.ts
│   │   │   └── queue.service.ts
│   │   ├── jwt/
│   │   │   ├── jwt.service.interface.ts
│   │   │   ├── jwt.types.ts
│   │   │   └── jwt.service.ts
│   │   └── ...                    # hash/, id/, swagger/, etc.
│   ├── middlewares/               # Global middlewares (auth, rate-limit, etc.)
│   └── core/                      # HTTP primitives + job error primitives
│       ├── api-error.ts           # ApiError base + subclasses (HTTP errors)
│       ├── api-response.ts        # Standard success response wrapper
│       ├── error-handler.ts       # Global Express error handler
│       └── job-errors.ts          # Job-specific errors (NonRetryableError)
│
├── domain/                        # Pure domain layer — entities, enums, value objects, errors
│   ├── entities/                  # Entity classes — aggregate roots with business logic
│   │   ├── user.entity.ts
│   │   └── organization.entity.ts
│   ├── enums/                     # Shared enums
│   │   ├── org-role.enum.ts
│   │   └── auth-provider.enum.ts
│   ├── value-objects/             # Immutable objects describing entity attributes
│   │   ├── user-membership.value-object.ts
│   │   └── org-member.value-object.ts
│   └── errors/                    # Domain-level errors (no HTTP codes)
│       └── domain-errors.ts
│
├── infrastructure/                # Data access and external integration layer
│   ├── repositories/              # Database access — one folder per entity/table
│   │   ├── users/
│   │   │   ├── users.repository.interface.ts
│   │   │   ├── users.types.ts
│   │   │   └── users.repository.ts
│   │   ├── organizations/
│   │   │   ├── organizations.repository.interface.ts
│   │   │   ├── organizations.types.ts
│   │   │   └── organizations.repository.ts
│   │
│   └── external-services/         # Third-party API integrations — one folder per service
│       └── <service-name>/
│           ├── <name>.external-service.interface.ts
│           ├── <name>.types.ts
│           └── <name>.external-service.ts
│
├── jobs/                          # Background job processing layer (async counterpart to modules)
│   ├── workers/                   # One folder per job type
│   │   └── <job-name>/
│   │       ├── <job-name>.worker.ts       # Job handler (receives payload, orchestrates logic)
│   │       └── <job-name>.types.ts        # Job payload/result types + job name constant
│   ├── registry.ts               # Maps job names to worker handlers (composition root)
│   └── job-runner.ts             # Worker process entry point (like server.ts for jobs)
│
├── modules/                       # All modules — system and feature
│   ├── system/                    # System-level routes (no business logic, no DB)
│   │   └── health.routes.ts       # Flat — no subfolders
│   │
│   ├── users/                     # Feature module example
│   │   ├── users.factory.ts
│   │   ├── interfaces/            # Module-specific interfaces (if needed)
│   │   ├── types/                 # Module-specific types (if needed)
│   │   ├── mappers/               # Module-specific mappers (if needed)
│   │   ├── application/
│   │   │   ├── dtos/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── get-user.dto.ts
│   │   │   ├── create-user.use-case.ts
│   │   │   └── get-user.use-case.ts
│   │   └── presentation/
│   │       ├── users.routes.ts
│   │       ├── users.controller.ts
│   │       └── users.validation.ts
│   │
│   └── auth/
│       ├── auth.factory.ts
│       ├── interfaces/            # Module-specific interfaces (if needed)
│       ├── types/                 # Module-specific types (if needed)
│       ├── application/
│       │   ├── dtos/
│       │   │   └── login.dto.ts
│       │   └── login.use-case.ts
│       └── presentation/
│           ├── auth.routes.ts
│           ├── auth.controller.ts
│           └── auth.validation.ts
│
├── app.ts                         # Express app setup
├── server.ts                      # HTTP server entry point
└── job-runner.ts                  # Job worker process entry point (or src/jobs/job-runner.ts)
```

## Rules

### `domain/`
- The lowest layer — nothing in `domain/` imports from `infrastructure/`, `modules/`, or `shared/services/`.
- For detailed rules, see `rules/domain/` — entities, value objects, and enums each have their own rules file.

### `infrastructure/`
- Contains all database interaction and external API integration code — no business logic.
- For detailed rules, see `rules/infrastructure/` — repositories and external services each have their own rules file.
- `repositories/` — one folder per entity/table, each containing:
  - `<name>.repository.interface.ts` — contract. Imports domain types, co-located row types for tables without entities, and the `PoolClient` type when transaction support is needed.
  - `<name>.types.ts` — raw DB row type. Plain `type` alias.
  - `<name>.repository.ts` — implementation. Each:
    - Imports its co-located interface and row type.
    - Has `private readonly TABLE = '<table_name>'` used in all SQL strings.
    - Has `constructor(private readonly db: IDatabaseService)`.
    - May accept an optional `PoolClient` as the final method argument. Transaction boundaries belong in use cases or job workers, never repositories.
- `external-services/` — one folder per third-party service, each containing:
  - `<name>.external-service.interface.ts` — contract. Use cases depend on this.
  - `<name>.types.ts` — request/response types for the external API.
  - `<name>.external-service.ts` — implementation (HTTP calls).

### `jobs/`
- The async processing layer — background jobs triggered by use cases, other workers, or schedules.
- `workers/` — one folder per job type. Each worker has a single `execute(payload)` method.
- `registry.ts` — the composition root for the jobs layer. Maps job names to instantiated worker handlers. Only file that imports concrete classes (same role as factory in modules).
- `job-runner.ts` — separate entry point (like `server.ts` for HTTP). Boots services, creates registry, starts processing.
- For detailed rules, see `rules/jobs/worker-rules.md`.

### `modules/`
- Every route in the app lives inside `modules/` — no exceptions.
- `modules/system/` — system-level routes only (health, ping, status). Flat, no subfolders.
- Feature modules have exactly this structure:
  - `<name>.factory.ts` — at module root. Wires repo + use cases → creates and returns controller.
  - `interfaces/` — module-specific interfaces, only created when the module needs them.
  - `types/` — module-specific types, only created when the module needs them.
  - `mappers/` — module-specific mappers, only created when the module needs them. A mapper translates one representation into another (for example an uploaded file name into a source type). It is a class with static methods, has no I/O and no dependencies, and use cases may import it. Business rule checks that throw errors stay in the use case.
  - `application/` — use cases and DTOs only.
  - `application/dtos/` — one file per use case, exports both request and response DTO.
  - `presentation/` — routes, controller, validation. One file each.
- `application/` must stay pure — only use cases and DTOs, never imports controller or repository directly.
- Modules never import from another module's folder directly.

### Import direction (strict)
```
factory (module root)
  → presentation/controller
  → application/use-cases
  → infrastructure/repositories/<entity>/
  → infrastructure/external-services/<service>/

presentation/routes
  → factory
  → presentation/validation

application/use-cases
  → infrastructure/repositories/<entity>/<entity>.repository.interface   (never the concrete class)
  → infrastructure/repositories/<entity>/<entity>.types                  (row types, only when needed for transactions)
  → infrastructure/external-services/<service>/<service>.external-service.interface  (never the concrete class)
  → shared/services/<name>/<name>.types                                  (service-related types like jwt.types.ts)
  → shared/services/<name>/<name>.service.interface                      (for IHashService, IJwtService, IQueueService, etc.)
  → jobs/workers/<job-name>/<job-name>.types                             (job payload types + name constant — for dispatching only)
  → mappers/<name>.mapper                                                (this module's mappers, only when needed)
  → domain/entities
  → domain/enums

jobs/workers/<job-name>/<job-name>.worker.ts
  → ./<job-name>.types                                                   (co-located payload/result types)
  → infrastructure/repositories/<entity>/<entity>.repository.interface   (never the concrete class)
  → infrastructure/external-services/<service>/<service>.external-service.interface
  → shared/services/<name>/<name>.service.interface                      (ILoggerService, IQueueService, etc.)
  → shared/core/job-errors                                               (NonRetryableError)
  → domain/entities
  → domain/enums

jobs/registry.ts
  → ./workers/<job-name>/<job-name>.worker       (concrete worker classes — composition root)
  → ./workers/<job-name>/<job-name>.types        (job name constants)
  → infrastructure/repositories/<entity>/        (concrete repos — for injection)
  → infrastructure/external-services/<svc>/      (concrete services — for injection)
  → shared/services/<name>/<name>.service.interface

jobs/job-runner.ts
  → ./registry
  → shared/services/<name>/<name>.service        (concrete — calls getInstance())
  → shared/config/

infrastructure/repositories/<entity>/<entity>.repository.ts
  → ./<entity>.repository.interface   (co-located)
  → ./<entity>.types                  (co-located)
  → domain/entities
  → domain/enums

infrastructure/external-services/<service>/<service>.external-service.ts
  → ./<service>.external-service.interface   (co-located)
  → ./<service>.types                        (co-located)
  → shared/services/<name>/<name>.service.interface  (for ILoggerService)
  → shared/config/
  → domain/enums
```
- `application/` never imports from `presentation/` or the concrete `*.repository.ts` files.
- `factory` is the only file allowed to import across all layers within a module.
- `registry.ts` is the only file allowed to import concrete classes within the jobs layer.
- `domain/` has zero imports from any other src folder — it is the base layer.
- Never import upward or sideways between modules.
- **Modules and jobs are parallel** — modules never import from `jobs/workers/` (only from `jobs/workers/<name>/<name>.types` for dispatching). Jobs never import from `modules/`.
- Modules needing shared data import from `domain/` or `infrastructure/repositories/` interfaces — never from another module's folder.
