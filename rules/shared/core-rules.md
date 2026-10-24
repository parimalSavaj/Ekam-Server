# Shared Core Rules

## Location

- All HTTP primitives live in `src/shared/core/`.
- This folder handles API errors, API responses, and the global error handler.

## Files

- `api-error.ts` — base `ApiError` class and all error subclasses.
- `api-response.ts` — standard `ApiResponse` wrapper for all successful responses.
- `error-handler.ts` — global Express error handler middleware (`ErrorHandler.handleError`).
- `job-errors.ts` — job-specific error classes (`NonRetryableError`).

## Error Hierarchy

```
ApiError (base)
├── NotFoundError        → 404
├── ValidationError      → 400
├── ConflictError        → 409
├── UnauthorizedError    → 401
├── ForbiddenError       → 403
└── InternalError        → 500
```

All subclasses live in `api-error.ts` — one file, no splitting.

## Where Errors Are Thrown

| Layer | Can throw | Example |
|---|---|---|
| Use case | Domain errors | `throw new NotFoundError('User not found')` |
| Repository | `InternalError` only | DB failures, connection errors |
| Controller | Never throws | passes to `next(error)` |
| Validation middleware | `ValidationError` | Invalid request shape |

## Error Handler

- Catches all errors via `next(error)`.
- `ApiError` → uses `error.toJSON()` for response.
- Unknown error → responds with `500 Internal Server Error`.
- In development, includes `error.stack`.
- Never exposes raw DB or third-party error messages in production.

## Rules

- All error classes live together in `api-error.ts` — no separate files.
- `job-errors.ts` is separate from `api-error.ts` — job errors have no HTTP status codes, they belong to a different execution context.
- Use cases throw named errors (`NotFoundError`, `ConflictError`) — never raw `Error` or `ApiError` directly.
- Workers throw `NonRetryableError` when a job should not be retried — for invalid payloads, missing prerequisites, or logical impossibilities.
- Controllers never throw — always `next(error)`.
- Repositories throw `InternalError` for unexpected DB failures only.
- Never catch and swallow errors silently.
- Never use `console.error` — use `LoggerService` in the error handler.
- Error messages must be human-readable and safe to expose to clients.
- Error and response primitives have no dependencies on services, middlewares, or modules. The global HTTP error handler may receive `ILoggerService` and use validated config for safe environment-specific formatting; it never imports feature modules.

## Job Errors — `job-errors.ts`

```ts
export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}
```

- `NonRetryableError` signals the queue system to move the job to dead-letter immediately — no retry.
- Any other error thrown by a worker is treated as retryable by default.
- Workers import `NonRetryableError` from `shared/core/job-errors` — never from `api-error.ts`.
- `NonRetryableError` has no HTTP status code — it's not an API error.
