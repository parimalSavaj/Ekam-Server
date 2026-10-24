# Shared Route Path Rules

## When to read

Read this document before creating, renaming, moving, or removing an API route, changing a router mount path, or updating an OpenAPI path definition. These rules apply to system endpoints and feature modules.

## Single source of truth

- Define route paths in `src/shared/constants/route-path.constants.ts`.
- Export one `ROUTE_PATHS` object with `as const`, grouped by module with UPPER_SNAKE_CASE keys.
- Register routes using these constants rather than hardcoded path strings.
- Reuse the same constants in computed Swagger path keys. Do not maintain a separate copy of the URL in API documentation code.
- Add only paths required by the current feature. Do not create speculative routes or dependencies.

```ts
// src/shared/constants/route-path.constants.ts
export const ROUTE_PATHS = {
  SYSTEM: {
    HEALTH: "/health",
  },
} as const;

// Route registration, after importing ROUTE_PATHS from the constants file:
router.get(ROUTE_PATHS.SYSTEM.HEALTH, handler);

// OpenAPI path definition, using the same import:
export const healthDocs = {
  [ROUTE_PATHS.SYSTEM.HEALTH]: {
    // Document the HTTP method and responses here.
  },
};
```

Use the correct relative `.js` import path for the consuming file. Keep route handlers and business logic out of the constants file.

## Adding a route

1. Check the constants file for an existing path before adding another entry. Multiple HTTP methods on the same URL should reuse its path constant.
2. Add the path under its module group, then use it in the module's route registration.
3. Reference it in the module's Swagger path definition and document the operation according to `rules/shared/swagger-rules.md`.
4. Keep route implementation in the folders defined by `rules/modules/presentation-rules.md` and `rules/general/folder-structure-rules.md`.

## Changing or removing a route

- Change the URL value in the constants file while keeping its symbolic key stable when the operation is unchanged. Consumers using the key then receive the new value automatically.
- If a key is renamed or removed, update every reference in the same change; use TypeScript checking to catch stale imports and property access.
- Search for the old URL in client callers, README examples, tests, and deployment health probes. Those consumers are not automatically updated by a server-only constant; update them when in scope or report the required follow-up.
- A public URL change can break existing clients. Preserve a compatibility alias only when the feature requirements call for one, and define that alias centrally too.

## Prefixes and parameters

- Keep shared prefixes and endpoint segments in the same constants file if routers need mounting prefixes. Compose the documented full path from those constants; avoid duplicating prefixes or embedding them in multiple files.
- Make it clear whether a constant is a full path or a router-relative segment. Do not mount a full path under the same prefix a second time.
- Express parameter syntax and OpenAPI parameter syntax differ: `:id` versus `{id}`. Derive the documented path from the canonical route pattern when parameters are introduced instead of maintaining two independent URL strings. Document the corresponding path parameters.
- For a simple endpoint such as health, use the full path directly. Do not add a path builder or conversion utility before a route actually needs one.

## Verification

- Run local `npx tsc --noEmit` after code changes and the relevant build checks.
- When changing route behavior or URLs, verify the endpoint and its documented path agree.
- Stop any server started for verification, including on failure; leave unrelated user-started processes alone.
