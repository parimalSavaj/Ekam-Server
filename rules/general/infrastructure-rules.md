# Infrastructure Layer Rules

## Overview

`src/infrastructure/` is the data access and external integration layer. No business logic — only database queries and third-party API calls.

## Structure

```
src/infrastructure/
├── repositories/          # One folder per entity/table
│   └── <name>/
│       ├── <name>.repository.interface.ts
│       ├── <name>.types.ts
│       └── <name>.repository.ts
└── external-services/     # One folder per third-party service
    └── <name>/
        ├── <name>.external-service.interface.ts
        ├── <name>.types.ts
        └── <name>.external-service.ts
```

## Key Principles

- Repositories return domain entities via a private `toEntity(row)` method that calls `Entity.fromRecord(row)`. The entity's `fromRecord` accepts an inline-typed row (snake_case) — TypeScript's structural typing matches `<Entity>Row` without the entity needing to import it.
- Row types are plain `type` aliases matching DB columns exactly (snake_case).
- Use cases depend on repository **interfaces** — never concrete classes.
- Never pre-create methods speculatively — add only when a use case needs them.
- All queries filter `WHERE deleted_at IS NULL` for soft-deleted tables.

## Detailed Rules

Read the relevant documents before editing these layers:
- `rules/infrastructure/repositories-rules.md`
- `rules/infrastructure/external-services-rules.md`
