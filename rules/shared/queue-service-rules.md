# Queue Service Rules

## Location

- The queue service lives in `src/shared/services/queue/` — same co-located pattern as all shared services.
- This is the abstraction layer between your application and whatever queue technology you choose.

## Folder Structure

```
src/shared/services/queue/
├── queue.service.interface.ts    # Contract — what the app depends on
├── queue.types.ts                # Queue-related types (job options, status, etc.)
└── queue.service.ts              # Concrete implementation (wraps the chosen queue tech)
```

## Interface — `queue.service.interface.ts`

The contract that use cases and workers depend on for dispatching jobs.

```ts
import { JobOptions, JobStatus } from './queue.types';

export interface IQueueService {
  /**
   * Dispatch a job to be processed asynchronously.
   * Fire-and-forget — returns once the job is enqueued, not when it completes.
   */
  dispatch<TPayload>(jobName: string, payload: TPayload, options?: JobOptions): Promise<void>;

  /**
   * Dispatch a job with a delay before it becomes available for processing.
   */
  dispatchWithDelay<TPayload>(jobName: string, payload: TPayload, delayMs: number, options?: JobOptions): Promise<void>;

  /**
   * Schedule a recurring job.
   * Implementation handles cron/interval scheduling.
   */
  schedule<TPayload>(jobName: string, payload: TPayload, cronExpression: string, options?: JobOptions): Promise<void>;

  /**
   * Get the current status of a dispatched job (if the queue supports it).
   * Returns null if job tracking is not supported or job not found.
   */
  getJobStatus(jobId: string): Promise<JobStatus | null>;

  /**
   * Start processing jobs using the provided registry of handlers.
   * Called by job-runner.ts at startup — blocks and processes indefinitely.
   */
  startProcessing(registry: Record<string, { execute(payload: unknown): Promise<unknown> }>): Promise<void>;

  /**
   * Connect to the queue backend.
   */
  connect(): Promise<void>;

  /**
   * Gracefully disconnect — finish in-progress jobs, stop accepting new ones.
   */
  disconnect(): Promise<void>;
}
```

## Types — `queue.types.ts`

Queue-related types shared across the service and consumers.

```ts
export type JobOptions = {
  /** Unique job ID — for idempotency. If not provided, auto-generated. */
  jobId?: string;

  /** Number of retry attempts before moving to dead-letter. Default: 3 */
  maxRetries?: number;

  /** Priority level (lower number = higher priority). Default: 0 (normal) */
  priority?: number;

  /** Backoff strategy between retries. Default: exponential */
  backoff?: 'fixed' | 'exponential';

  /** Initial backoff delay in milliseconds. Default: 1000 */
  backoffDelay?: number;
};

export type JobStatus = {
  id: string;
  name: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'dead-letter';
  attempts: number;
  maxRetries: number;
  createdAt: string;
  processedAt: string | null;
  failedReason: string | null;
};
```

## Implementation — `queue.service.ts`

The concrete implementation wraps whatever queue technology you choose. Follows singleton pattern like all shared services.

```ts
import { IQueueService } from './queue.service.interface';
import { JobOptions, JobStatus } from './queue.types';
import { config } from '../../config';

export class QueueService implements IQueueService {
  private static instance: QueueService;

  private constructor() {
    // Initialize queue client using config values
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  async connect(): Promise<void> { /* Connect to queue backend */ }
  async disconnect(): Promise<void> { /* Graceful shutdown */ }

  async dispatch<TPayload>(jobName: string, payload: TPayload, options?: JobOptions): Promise<void> {
    // Serialize payload and enqueue
  }

  async dispatchWithDelay<TPayload>(jobName: string, payload: TPayload, delayMs: number, options?: JobOptions): Promise<void> {
    // Enqueue with delay
  }

  async schedule<TPayload>(jobName: string, payload: TPayload, cronExpression: string, options?: JobOptions): Promise<void> {
    // Register recurring job
  }

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    // Query queue backend for job state
  }

  async startProcessing(registry: Record<string, { execute(payload: unknown): Promise<unknown> }>): Promise<void> {
    // Listen for jobs, route to handlers from registry
    // Handle retry logic, dead-letter routing, error classification
  }
}
```

## Rules

### Interface Rules
- `IQueueService` is the only queue abstraction the app knows — use cases, workers, and the registry depend on this interface alone.
- Methods are generic (`dispatch<TPayload>`) — the queue doesn't know or care about specific payload shapes.
- `dispatch()` is fire-and-forget — it resolves when the job is enqueued, not when it's processed.
- `startProcessing()` accepts the registry map — the queue service routes incoming jobs to the correct handler by job name.

### Implementation Rules
- Singleton pattern — `private constructor` + `static getInstance()`.
- All queue connection details (host, port, credentials, queue names) come from `shared/config/` — never hardcoded.
- The implementation handles:
  - Serialization/deserialization of payloads (JSON).
  - Retry logic with configurable backoff.
  - Dead-letter routing after max retries.
  - Error classification: normal errors → retry, `NonRetryableError` → dead-letter immediately.
  - Graceful shutdown (finish current job, stop polling).
- Never contains business logic — only queue operations.
- Logs queue events (dispatch, start processing, completion, failure) via `ILoggerService`.

### Swapping Queue Technology

Because use cases and workers depend only on `IQueueService`:
1. Create a new `queue.service.ts` implementation wrapping the new technology.
2. Keep the same interface contract.
3. Update `server.ts` and `job-runner.ts` to instantiate the new implementation.
4. Zero changes to use cases, workers, or the registry.

Examples of swappable backends:
- BullMQ (Redis-based)
- AWS SQS
- RabbitMQ / AMQP
- PostgreSQL-based (pg-boss)
- In-memory (for testing/dev)

### Injection Pattern

```
server.ts (HTTP process):
  → QueueService.getInstance() — for dispatching jobs from use cases

job-runner.ts (Worker process):
  → QueueService.getInstance() — for processing jobs + dispatching follow-ups

Module factories:
  → Receive IQueueService as parameter when a use case needs to dispatch jobs

Job registry:
  → Receives IQueueService as parameter for workers that chain jobs
```

### Config Values (in shared/config)

The queue service needs these config values (names may vary by tech):

```ts
// In shared/config/index.ts
queue: {
  host: z.string(),
  port: z.coerce.number(),
  password: z.string().optional(),
  defaultMaxRetries: z.coerce.number().default(3),
  defaultBackoffDelay: z.coerce.number().default(1000),
}
```

## Import Rules

```
queue.service.ts imports:
  → ./queue.service.interface
  → ./queue.types
  → shared/config/
  → shared/services/logger/logger.service.interface  (for logging queue events)

queue.service.interface.ts imports:
  → ./queue.types

Consumers (use cases, workers) import:
  → shared/services/queue/queue.service.interface    (interface only)
  → shared/services/queue/queue.types                (JobOptions, JobStatus — only if needed)
```

## Testing Strategy

- **Unit tests** for workers: mock `IQueueService`, `IRepository`, `IExternalService` — test business logic in isolation.
- **Integration tests** for dispatching: use an in-memory `IQueueService` implementation — verify jobs are dispatched with correct payloads.
- **The interface makes everything testable** — swap the real queue with a mock/stub/in-memory version.
