# Shared Layer Rules

## Overview

`src/shared/` contains cross-cutting concerns used across the entire app. Nothing feature-specific lives here.

## Structure

```
src/shared/
├── @types/          # .d.ts augmentations for third-party libraries
├── config/          # App configuration (env vars parsed with Zod)
├── constants/       # Shared constants (route prefixes, status codes)
├── core/            # HTTP primitives (ApiError, ApiResponse, ErrorHandler) + job error primitives (NonRetryableError)
├── middlewares/     # Global middlewares (auth, validate, role)
└── services/        # Shared services — one folder per service
    ├── logger/      # interface + implementation
    ├── database/    # interface + types + implementation
    ├── queue/       # interface + types + implementation (job dispatching/processing)
    ├── jwt/         # interface + types + implementation
    └── ...          # hash/, id/, swagger/, etc.
```

## Key Principles

- Services use singleton pattern — `private constructor` + `static getInstance()`.
- Services instantiated in `server.ts` (for HTTP process) and `job-runner.ts` (for worker process), passed into their respective bootstraps via interfaces.
- `core/` has ApiError subclasses (NotFoundError, ConflictError, etc.) — use cases throw these.
- `core/` also has `job-errors.ts` with `NonRetryableError` — workers throw this when a job should not be retried.
- Enums do NOT live here — all enums live in `src/domain/enums/`.

## Detailed Rules

Read the relevant documents before editing these layers:
- `rules/shared/services-rules.md`
- `rules/shared/queue-service-rules.md`
- `rules/shared/core-rules.md`
- `rules/shared/config-rules.md`
- `rules/shared/middlewares-rules.md`
- `rules/shared/types-rules.md`
- `rules/shared/swagger-rules.md`
