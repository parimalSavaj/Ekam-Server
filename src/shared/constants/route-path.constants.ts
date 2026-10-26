export const ROUTE_PATHS = {
  AUTH: {
    BASE: "/api/auth",
    HANDLER: "/api/auth/{*splat}",
    SCHEMA: "/api/auth/open-api/generate-schema",
  },
  SYSTEM: {
    HEALTH: "/health",
  },
  // Full paths: the workspaces router is mounted at the app root. Express syntax (:id);
  // the OpenAPI docs derive "{id}" from these with toOpenApiPath().
  WORKSPACES: {
    BASE: "/api/workspaces",
    BY_ID: "/api/workspaces/:id",
  },
} as const;
