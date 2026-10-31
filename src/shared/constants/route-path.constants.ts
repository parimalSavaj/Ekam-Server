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
  // Full paths, nested under a workspace. The knowledge bases router is mounted at the app root.
  KNOWLEDGE_BASES: {
    BASE: "/api/workspaces/:workspaceId/knowledge-bases",
    BY_ID: "/api/workspaces/:workspaceId/knowledge-bases/:id",
  },
  // Full paths, nested under a knowledge base. The sources router is mounted at the app root.
  SOURCES: {
    BASE: "/api/workspaces/:workspaceId/knowledge-bases/:knowledgeBaseId/sources",
    FILES: "/api/workspaces/:workspaceId/knowledge-bases/:knowledgeBaseId/sources/files",
    WEB_PAGES: "/api/workspaces/:workspaceId/knowledge-bases/:knowledgeBaseId/sources/web-pages",
    BY_ID: "/api/workspaces/:workspaceId/knowledge-bases/:knowledgeBaseId/sources/:id",
  },
} as const;
