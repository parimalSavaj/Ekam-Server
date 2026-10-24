# Jobs Layer Rules

## Overview

`src/jobs/` is the background processing layer — the async counterpart to `src/modules/`. While modules handle synchronous HTTP request/response cycles, jobs handle asynchronous work triggered by events, schedules, or explicit dispatching from use cases.

## When to Use Jobs vs Use Cases

| Scenario | Where it lives |
|---|---|
| User clicks a button, expects immediate response | Module use case (sync) |
| Work takes more than a few seconds (document parsing, AI calls, embedding generation) | Job worker (async) |
| Work can fail and needs retry without blocking the user | Job worker (async) |
| Work is triggered by a completed operation, not a direct user request | Job worker (async, dispatched from a use case) |
| Scheduled/recurring tasks (cleanup, digest emails, index refresh) | Job worker (async, scheduled) |

## Folder Structure

```
src/jobs/
├── workers/                       # One folder per job type
│   ├── <job-name>/
│   │   ├── <job-name>.worker.ts           # Job handler (receives payload, orchestrates logic)
│   │   ├── <job-name>.worker.interface.ts # Worker contract (optional, for complex workers)
│   │   └── <job-name>.types.ts            # Job payload and result types
│   └── <job-name>/
│       ├── <job-name>.worker.ts
│       └── <job-name>.types.ts
├── registry.ts                    # Maps job names to worker handlers (composition root for jobs)
└── job-runner.ts                  # Bootstraps the job processing loop (entry point for worker process)
```

## Key Principles

- **Same architecture philosophy as modules** — workers depend on interfaces, never concrete classes. Repositories, external services, and shared services are injected.
- **Workers are the job equivalent of controllers** — they receive a typed payload, validate it, call into infrastructure/domain, and return a result or throw.
- **Use cases can dispatch jobs but never process them** — dispatching is a fire-and-forget call via `IQueueService`. The worker that processes the job is a separate execution context.
- **Jobs are tech-agnostic** — the queue system (BullMQ, SQS, RabbitMQ, in-memory) is abstracted behind `IQueueService`. Workers never import queue-specific libraries directly.
- **Each job type has a unique string name** — this is the key used to dispatch and route jobs. Defined as a constant in the job's types file.
- **Jobs can dispatch other jobs** — a worker can call `IQueueService.dispatch()` to chain work (e.g., "parse document" dispatches "generate embeddings" on completion).

## Import Direction (strict)

```
jobs/workers/<name>/<name>.worker.ts imports:
  → ./<name>.types                                                        (job payload/result types)
  → infrastructure/repositories/<entity>/<entity>.repository.interface    (never concrete class)
  → infrastructure/external-services/<service>/<service>.external-service.interface
  → shared/services/<name>/<name>.service.interface                       (ILoggerService, IQueueService, etc.)
  → domain/entities/
  → domain/enums/

jobs/registry.ts imports:
  → ./workers/<name>/<name>.worker           (concrete worker classes — composition root)
  → infrastructure/repositories/<entity>/    (concrete repos — for injection)
  → infrastructure/external-services/<svc>/  (concrete services — for injection)
  → shared/services/<name>/<name>.service.interface

jobs/job-runner.ts imports:
  → ./registry
  → shared/services/<name>/<name>.service    (concrete — calls getInstance(), like server.ts)
  → shared/config/
```

- Workers never import from `modules/` — jobs and modules are parallel, never cross-dependent.
- Modules may import job name constants and payload types from a worker's `.types.ts` file to dispatch via `IQueueService`. Modules never import or call concrete worker classes.
- `registry.ts` is the only file that imports concrete worker classes (same role as factory in modules).

## Relationship to Modules

```
Module Use Case (sync)                     Job Worker (async)
─────────────────────                      ─────────────────
Triggered by HTTP request                  Triggered by queue message
Receives DTO from controller               Receives typed payload from queue
Returns response DTO                       Returns result or throws (retry/fail)
Dispatches jobs via IQueueService           Can dispatch further jobs via IQueueService
Lives in src/modules/<name>/application/   Lives in src/jobs/workers/<name>/
```

A typical flow:
1. User uploads a document → module use case saves metadata to DB, dispatches `process-document` job.
2. Worker picks up the job → parses document, chunks text, dispatches `generate-embeddings` job.
3. Worker picks up the next job → generates embeddings, stores in vector DB.
4. All async — user got an immediate "upload accepted" response at step 1.

## Error Handling

- Workers throw errors like use cases do — but instead of reaching an HTTP error handler, the queue system catches them for retry.
- Retryable errors (network timeout, rate limit) → throw normally, let the queue system retry.
- Non-retryable errors (invalid payload, corrupt file) → mark as permanently failed, log, do not retry.
- Workers use `ILoggerService` for structured logging — same as use cases.
- Dead-letter behavior (what happens after max retries) is configured at the queue level, not in the worker code.

## Detailed Rules

Read the relevant documents before editing these layers:
- `rules/jobs/worker-rules.md`
- `rules/shared/queue-service-rules.md`
