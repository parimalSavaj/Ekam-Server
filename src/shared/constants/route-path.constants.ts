export const ROUTE_PATHS = {
  AUTH: {
    BASE: "/api/auth",
    HANDLER: "/api/auth/{*splat}",
    SCHEMA: "/api/auth/open-api/generate-schema",
  },
  SYSTEM: {
    HEALTH: "/health",
  },
} as const;
