# Worker Rules

## Location

- All workers live in `src/jobs/workers/` — one folder per job type.
- Folder naming: `<job-name>/` (kebab-case, e.g., `process-document/`, `generate-embeddings/`, `send-notification/`).

## Folder Structure (per worker)

Each worker folder contains:

```
src/jobs/workers/<job-name>/
├── <job-name>.worker.ts           # Job handler class
├── <job-name>.types.ts            # Payload type, result type, job name constant
└── <job-name>.worker.interface.ts # (Optional) Worker contract for complex workers
```

## Types — `<job-name>.types.ts`

Defines the job's payload (input), result (output), and unique name constant.

```ts
export const <JOB_NAME>_JOB = '<job-name>' as const;

export type <PascalJobName>Payload = {
  <field1>: <type>;
  <field2>: <type>;
  // All data the worker needs to do its job
  // Must be serializable (no class instances, no functions, no Dates — use ISO strings)
};

export type <PascalJobName>Result = {
  <field1>: <type>;
  // What the job produces on success (can be void/empty for fire-and-forget jobs)
};
```

Type Rules:
- Job name constant: `<UPPER_SNAKE>_JOB` — used for dispatching and routing. Value is the kebab-case job name string.
- Payload must be **JSON-serializable** — no class instances, no `Date` objects (use ISO strings), no functions, no circular references.
- Payload contains everything the worker needs — it must not rely on external state that may change between dispatch and processing (eventual consistency).
- Include IDs to look up fresh data, not stale snapshots of entities.
- Result type is optional — many jobs are fire-and-forget. Define it when downstream code (other jobs, status tracking) needs the output.
- One types file per worker folder.

## Worker — `<job-name>.worker.ts`

The handler class that processes one job. Equivalent to a use case but for async work.

```ts
import { ILoggerService } from '../../../shared/services/logger/logger.service.interface';
import { IQueueService } from '../../../shared/services/queue/queue.service.interface';
import { I<Entity>Repository } from '../../../infrastructure/repositories/<entity>/<entity>.repository.interface';
import { I<Service>ExternalService } from '../../../infrastructure/external-services/<service>/<service>.external-service.interface';
import { <PascalJobName>Payload, <PascalJobName>Result } from './<job-name>.types';

export class <PascalJobName>Worker {
  constructor(
    private readonly <entityRepo>: I<Entity>Repository,
    private readonly <externalService>: I<Service>ExternalService,
    private readonly queue: IQueueService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(payload: <PascalJobName>Payload): Promise<<PascalJobName>Result> {
    this.logger.info('<Job name> started', { <contextual fields from payload> });

    // 1. Validate payload / load fresh data from DB
    // 2. Do the work (call external services, transform data, etc.)
    // 3. Persist results
    // 4. Optionally dispatch follow-up jobs
    // 5. Return result

    this.logger.info('<Job name> completed', { <result context> });
    return { ... };
  }
}
```

Worker Rules:
- Class name: `<PascalJobName>Worker` (e.g., `ProcessDocumentWorker`, `GenerateEmbeddingsWorker`).
- Single `execute(payload)` method — accepts the typed payload, returns the typed result (or `Promise<void>`).
- Constructor receives **interfaces only** — same dependency injection philosophy as use cases.
- Workers are instantiated in `registry.ts` (the composition root for jobs) — never self-instantiating.
- **Always load fresh data** — payloads contain IDs, not stale entity snapshots. The first step is usually fetching the current state from the repository.
- **Idempotent when possible** — if the same job runs twice with the same payload, it should produce the same result or gracefully skip (for retry safety).
- Workers can dispatch follow-up jobs via `this.queue.dispatch()` — this is how job chains/pipelines work.
- Workers never import from `modules/` — they are a parallel execution path.
- Workers never handle HTTP concerns (no `Request`, no `Response`, no `ApiResponse`).
- **Only create what is needed** — only add workers when a feature actually requires async processing.

## Registry — `registry.ts`

The composition root for all workers. Maps job names to instantiated worker handlers. Equivalent to the factory in modules, but for the entire jobs layer.

```ts
import { IDatabaseService } from '../../shared/services/database/database.service.interface';
import { ILoggerService } from '../../shared/services/logger/logger.service.interface';
import { IQueueService } from '../../shared/services/queue/queue.service.interface';
import { <Entity>Repository } from '../../infrastructure/repositories/<entity>/<entity>.repository';
import { <Service>ExternalService } from '../../infrastructure/external-services/<service>/<service>.external-service.ts';
import { <PascalJobName>Worker } from './workers/<job-name>/<job-name>.worker';
import { <JOB_NAME>_JOB } from './workers/<job-name>/<job-name>.types';

export type JobHandler = {
  execute(payload: unknown): Promise<unknown>;
};

export function createJobRegistry(
  db: IDatabaseService,
  logger: ILoggerService,
  queue: IQueueService,
): Record<string, JobHandler> {
  // Instantiate infrastructure
  const <entityRepo> = new <Entity>Repository(db);
  const <externalService> = new <Service>ExternalService(logger);

  // Instantiate workers
  const <jobName>Worker = new <PascalJobName>Worker(<entityRepo>, <externalService>, queue, logger);

  // Map job names to handlers
  return {
    [<JOB_NAME>_JOB]: <jobName>Worker,
  };
}
```

Registry Rules:
- Single function `createJobRegistry()` — receives shared services, returns a map of job name → worker instance.
- **Only file** that imports concrete infrastructure classes in the jobs layer (same as factory in modules).
- Every new worker must be registered here.
- The registry does not handle queue connection, polling, or retry logic — that's `job-runner.ts` and `IQueueService`'s responsibility.

## Job Runner — `job-runner.ts`

The entry point for the worker process. Boots services, creates the registry, starts listening for jobs.

```ts
import { DatabaseService } from '../../shared/services/database/database.service';
import { LoggerService } from '../../shared/services/logger/logger.service';
import { QueueService } from '../../shared/services/queue/queue.service';
import { createJobRegistry } from './registry';
import { config } from '../../shared/config';

async function main(): Promise<void> {
  const logger = LoggerService.getInstance();
  const db = DatabaseService.getInstance();
  const queue = QueueService.getInstance();

  await db.connect();
  await queue.connect();

  const registry = createJobRegistry(db, logger, queue);

  // Start processing — implementation depends on queue tech
  await queue.startProcessing(registry);

  logger.info('Job runner started', { registeredJobs: Object.keys(registry) });
}

main().catch((error) => {
  LoggerService.getInstance().error('Job runner failed to start', error);
  process.exit(1);
});
```

Job Runner Rules:
- Separate entry point from `server.ts` — jobs run in their own process (can scale independently).
- Instantiates concrete services (like `server.ts` does for the HTTP process).
- Never contains business logic — only bootstrapping.
- Handles graceful shutdown (SIGTERM, SIGINT) — completes in-progress jobs before exiting.

## Error Handling in Workers

Workers need a different error strategy than HTTP use cases because there is no client to respond to.

### Retryable vs Non-Retryable Errors

```ts
import { NonRetryableError } from '../../../shared/core/job-errors';

async execute(payload: <PascalJobName>Payload): Promise<<PascalJobName>Result> {
  // 1. Validate payload — non-retryable if invalid
  const entity = await this.<entityRepo>.findById(payload.entityId);
  if (!entity) {
    throw new NonRetryableError(`Entity ${payload.entityId} not found - may have been deleted`);
  }

  // 2. External call — retryable (throw normally, queue will retry)
  const result = await this.<externalService>.process(entity);

  // 3. Persist — retryable (throw normally)
  await this.<entityRepo>.update(entity);

  return { ... };
}
```

### Error Classification

| Error Type | Behavior | Examples |
|---|---|---|
| Retryable | Throw normally → queue retries with backoff | Network timeout, rate limit, DB connection lost, external service 503 |
| Non-retryable | Throw `NonRetryableError` → queue moves to dead-letter, no retry | Invalid payload, entity deleted, corrupt data, business rule violation |

### Rules

- **Default is retryable** — any normal `throw new Error(...)` or infrastructure error is retried by the queue system.
- **Explicitly mark non-retryable** — throw `NonRetryableError` when retrying would never succeed (bad data, missing prerequisite, logical impossibility).
- **Log before throwing** — include business context (IDs, state) so failures are debuggable from logs.
- **Never swallow errors** — if something fails, throw. Let the queue system handle retry/dead-letter decisions.
- **Idempotency protects against duplicate processing** — design workers so that running the same payload twice doesn't corrupt data (use upserts, check-before-write, idempotency keys).

## Dispatching Jobs from Use Cases

Use cases dispatch jobs via `IQueueService` — they never import worker classes or process jobs inline.

```ts
// Inside a module use case
import { IQueueService } from '../../../shared/services/queue/queue.service.interface';
import { PROCESS_DOCUMENT_JOB, ProcessDocumentPayload } from '../../../jobs/workers/process-document/process-document.types';

export class UploadSourceUseCase {
  constructor(
    private readonly <repo>: I<Entity>Repository,
    private readonly queue: IQueueService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(dto: UploadSourceRequestDto): Promise<UploadSourceResponseDto> {
    // ... save source metadata to DB ...

    // Dispatch async processing
    await this.queue.dispatch<ProcessDocumentPayload>(PROCESS_DOCUMENT_JOB, {
      sourceId: source.id,
      notebookId: dto.notebookId,
      fileUrl: storedFileUrl,
    });

    this.logger.info('Document processing job dispatched', { sourceId: source.id });

    // Return immediately — processing happens in background
    return UploadSourceResponseDto.toResponse(source);
  }
}
```

Dispatching Rules:
- Use cases import only the **types file** from jobs (payload type + job name constant) — never the worker class.
- `IQueueService.dispatch()` is generic — accepts any payload type.
- Dispatching is fire-and-forget — the use case does not wait for the job to complete.
- The job payload must be self-contained — include all IDs needed, never pass entity instances.
- If dispatching fails, the use case decides: throw (rollback the sync work) or log and continue (best-effort async).

## Job Chaining (Pipelines)

Workers can dispatch follow-up jobs to create processing pipelines:

```
upload-source (use case, sync)
  → dispatches: process-document (job)
      → dispatches: chunk-text (job)
          → dispatches: generate-embeddings (job)
              → dispatches: update-source-status (job)
```

Rules:
- Each step is an independent job — can be retried individually without re-running the whole pipeline.
- Workers dispatch the next step only after their own work is persisted.
- If a pipeline step fails permanently, downstream jobs are never dispatched — the pipeline halts at that point.
- Status tracking (if needed) is a separate concern — a source entity has a `processing_status` field updated by each step's worker.

## Scheduled Jobs

For recurring work (cleanup stale data, refresh indexes, send digests):

```ts
// In types file
export const CLEANUP_EXPIRED_TOKENS_JOB = 'cleanup-expired-tokens' as const;

export type CleanupExpiredTokensPayload = {
  // May be empty for scheduled jobs — the worker knows what to do
};
```

Rules:
- Scheduled jobs follow the same worker structure — they just have a time-based trigger instead of an event-based one.
- Schedule configuration lives in `shared/config/` or the job-runner bootstrap — not inside the worker.
- Scheduled workers are still idempotent — if the scheduler fires twice, no harm done.

## Checklist — Adding a New Job

1. Create `src/jobs/workers/<job-name>/<job-name>.types.ts` — define job name constant, payload type, result type.
2. Create `src/jobs/workers/<job-name>/<job-name>.worker.ts` — implement the handler with `execute(payload)`.
3. Register in `src/jobs/registry.ts` — import worker, instantiate with deps, add to the map.
4. Dispatch from the use case or another worker — import only the types file, call `this.queue.dispatch()`.
5. Run `npx tsc --noEmit` — must pass with zero errors.
