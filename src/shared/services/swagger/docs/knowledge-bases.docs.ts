import { ROUTE_PATHS } from "../../../constants/route-path.constants.js";
import { toOpenApiPath } from "../openapi-path.js";

// Knowledge base endpoints are protected by the Better Auth session cookie. A knowledge base is
// reachable only through a workspace the signed-in user owns.
const security = [{ sessionCookie: [] }];

const workspaceIdParameter = {
  name: "workspaceId",
  in: "path",
  required: true,
  description: "Id of the workspace that holds the knowledge base",
  schema: { type: "string", format: "uuid" },
};

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Knowledge base id",
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

const invalidRequest = failure(
  "Invalid request, for example a missing or too long name, a description over 500 characters, an update with no fields, a malformed id, or a body that is not valid JSON",
);
const notSignedIn = failure("No valid session");
const workspaceNotFound = failure("The workspace does not exist or belongs to another user");
const notFound = failure("The knowledge base does not exist in this workspace, or the workspace belongs to another user");
const unexpected = failure("Unexpected server error");

export const knowledgeBasesDocs: Record<string, Record<string, unknown>> = {
  [toOpenApiPath(ROUTE_PATHS.KNOWLEDGE_BASES.BASE)]: {
    get: {
      tags: ["Knowledge bases"],
      summary: "List the knowledge bases of a workspace",
      description: "Returns the knowledge bases of one of the signed-in user's workspaces, oldest first.",
      security,
      parameters: [workspaceIdParameter],
      responses: {
        "200": success("The workspace's knowledge bases", "ListKnowledgeBasesResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": workspaceNotFound,
        "500": unexpected,
      },
    },
    post: {
      tags: ["Knowledge bases"],
      summary: "Create a knowledge base",
      description: "Creates a knowledge base in one of the signed-in user's workspaces.",
      security,
      parameters: [workspaceIdParameter],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CreateKnowledgeBaseRequest" } } },
      },
      responses: {
        "201": success("The new knowledge base", "KnowledgeBaseResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": workspaceNotFound,
        "500": unexpected,
      },
    },
  },
  [toOpenApiPath(ROUTE_PATHS.KNOWLEDGE_BASES.BY_ID)]: {
    get: {
      tags: ["Knowledge bases"],
      summary: "Get a knowledge base",
      description: "Returns one knowledge base from one of the signed-in user's workspaces.",
      security,
      parameters: [workspaceIdParameter, idParameter],
      responses: {
        "200": success("The knowledge base", "KnowledgeBaseResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": notFound,
        "500": unexpected,
      },
    },
    patch: {
      tags: ["Knowledge bases"],
      summary: "Update a knowledge base",
      description: "Changes the name and/or description of a knowledge base. Fields that are left out stay unchanged.",
      security,
      parameters: [workspaceIdParameter, idParameter],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateKnowledgeBaseRequest" } } },
      },
      responses: {
        "200": success("The updated knowledge base", "KnowledgeBaseResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": notFound,
        "500": unexpected,
      },
    },
    delete: {
      tags: ["Knowledge bases"],
      summary: "Delete a knowledge base",
      description: "Permanently deletes a knowledge base. This cannot be undone.",
      security,
      parameters: [workspaceIdParameter, idParameter],
      responses: {
        "200": success("The id of the deleted knowledge base", "DeleteKnowledgeBaseResponse"),
        "400": invalidRequest,
        "401": notSignedIn,
        "404": notFound,
        "500": unexpected,
      },
    },
  },
};
