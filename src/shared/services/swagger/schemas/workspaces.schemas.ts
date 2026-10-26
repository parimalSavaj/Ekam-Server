export const workspacesSchemas: Record<string, Record<string, unknown>> = {
  // Shared by the create, get and rename responses and by each item of the list response.
  WorkspaceResponse: {
    type: "object",
    required: ["id", "name", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid", example: "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b" },
      name: { type: "string", maxLength: 100, example: "Product team" },
      createdAt: { type: "string", format: "date-time", example: "2026-10-26T09:30:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-10-26T09:30:00.000Z" },
    },
  },
  CreateWorkspaceRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, example: "Product team" },
    },
  },
  UpdateWorkspaceRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, example: "Customer research" },
    },
  },
  ListWorkspacesResponse: {
    type: "object",
    required: ["workspaces"],
    properties: {
      workspaces: { type: "array", items: { $ref: "#/components/schemas/WorkspaceResponse" } },
    },
  },
  DeleteWorkspaceResponse: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", example: "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b" },
    },
  },
};
