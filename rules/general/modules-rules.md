# Modules Layer Rules

## Overview

`src/modules/` contains all application features. Every API endpoint lives inside a module. Two types: system (flat, no business logic) and feature (layered).

## Feature Module Structure

```
src/modules/<name>/
├── <name>.factory.ts          # Composition root — wires deps, returns controller
├── application/
│   ├── dtos/
│   │   └── <action>.dto.ts   # Request + Response DTO classes (one file per API)
│   └── <action>.use-case.ts  # Business logic (one file per API, single execute())
└── presentation/
    ├── <name>.routes.ts       # Registers endpoints, applies validation
    ├── <name>.controller.ts   # Handles req/res, delegates to use cases
    └── <name>.validation.ts   # Zod schemas
```

## Key Principles

- One API = one DTO file + one use case file — always 1:1.
- DTOs are **classes with constructors** (not interfaces).
- Use cases receive **interfaces only** — never concrete classes.
- Use cases can dispatch background jobs via `IQueueService` — importing only the job's types file (payload type + name constant), never the worker class.
- Factory is the **only file** that imports concrete infrastructure classes.
- Controller methods are arrow functions, wrap results in `ApiResponse`, errors go to `next(error)`.
- Layer calling: Routes → Factory → Controller → Use Case → Repository.
- For async work: Use Case → `IQueueService.dispatch()` → (processed later by worker in `src/jobs/`).

## Detailed Rules

Read the relevant documents before editing these layers:
- `rules/modules/application-rules.md`
- `rules/modules/presentation-rules.md`
- `rules/modules/factory-rules.md`
