import { ROUTE_PATHS } from "../../../constants/route-path.constants.js";
import { toOpenApiPath } from "../openapi-path.js";

// Workspace endpoints are protected by the Better Auth session cookie and scoped to the signed-in user.
const security = [{ sessionCookie: [] }];

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Workspace id",
  schema: { type: "string", format: "uuid" },
};

function success(description: string, schemaName: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          allOf: [
            { $ref: "#/components/schemas/ApiResponse" },
            { type: "object", properties: { data: { $ref: `#/components/schemas/${schemaName}` } } },
          ],
        },
      },
    },
  };
}

function failure(description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  };
}

const invalidRequest = failure("Invalid request, for example a missing or too long name, a malformed id, or a body that is not valid JSON");
const notSignedIn = failure("No valid session");
const notFound = failure("The workspace does not exist or belongs to another user");
const unexpected = failure("Unexpected server error");

export const workspacesDocs: Record<string, Record<string, unknown>> = {
  [toOpenApiPath(ROUTE_PATHS.WORKSPACES.BASE)]: {
    get: {
      tags: ["Workspaces"],
      summary: "List my workspaces",
      description: "Returns the signed-in user's workspaces, oldest first.",
      security,
      responses: {
        "200": success("The user's workspaces", "ListWorkspacesResponse"),
        "401": notSignedIn,
        "500": unexpected,
      },
    },
    post: {
      tags: ["Workspaces"],
      summary: "Create a workspace",
      description: "Creates a workspace owned by the signed-in user.",
      security,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkspaceRequest" } } },
      },
      responses: {
        "201": success("The new workspace", "WorkspaceResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "500": unexpected,
      },
    },
  },
  [toOpenApiPath(ROUTE_PATHS.WORKSPACES.BY_ID)]: {
    get: {
      tags: ["Workspaces"],
      summary: "Get a workspace",
      description: "Returns one of the signed-in user's workspaces.",
      security,
      parameters: [idParameter],
      responses: {
        "200": success("The workspace", "WorkspaceResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": notFound,
        "500": unexpected,
      },
    },
    patch: {
      tags: ["Workspaces"],
      summary: "Rename a workspace",
      description: "Changes the name of one of the signed-in user's workspaces.",
      security,
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateWorkspaceRequest" } } },
      },
      responses: {
        "200": success("The renamed workspace", "WorkspaceResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": notFound,
        "500": unexpected,
      },
    },
    delete: {
      tags: ["Workspaces"],
      summary: "Delete a workspace",
      description: "Permanently deletes one of the signed-in user's workspaces. This cannot be undone.",
      security,
      parameters: [idParameter],
      responses: {
        "200": success("The id of the deleted workspace", "DeleteWorkspaceResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": notFound,
        "500": unexpected,
      },
    },
  },
};
