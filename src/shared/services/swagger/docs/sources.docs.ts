import { ROUTE_PATHS } from "../../../constants/route-path.constants.js";
import { toOpenApiPath } from "../openapi-path.js";

// Source endpoints are protected by the Better Auth session cookie. A source is reachable only
// through a knowledge base in a workspace the signed-in user owns.
const security = [{ sessionCookie: [] }];

const workspaceIdParameter = {
  name: "workspaceId",
  in: "path",
  required: true,
  description: "Id of the workspace that holds the knowledge base",
  schema: { type: "string", format: "uuid" },
};

const knowledgeBaseIdParameter = {
  name: "knowledgeBaseId",
  in: "path",
  required: true,
  description: "Id of the knowledge base that holds the source",
  schema: { type: "string", format: "uuid" },
};

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Source id",
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

const notSignedIn = failure("No valid session");
const knowledgeBaseNotFound = failure("The knowledge base does not exist in this workspace, or the workspace belongs to another user");
const sourceNotFound = failure("The source does not exist in this knowledge base, or the workspace belongs to another user");
const unexpected = failure("Unexpected server error");

export const sourcesDocs: Record<string, Record<string, unknown>> = {
  [toOpenApiPath(ROUTE_PATHS.SOURCES.BASE)]: {
    get: {
      tags: ["Sources"],
      summary: "List the sources of a knowledge base",
      description: "Returns the sources of one of the signed-in user's knowledge bases, oldest first.",
      security,
      parameters: [workspaceIdParameter, knowledgeBaseIdParameter],
      responses: {
        "200": success("The knowledge base's sources", "ListSourcesResponse"),
        "400": failure("A malformed id"),
        "401": notSignedIn,
        "404": knowledgeBaseNotFound,
        "500": unexpected,
      },
    },
  },
  [toOpenApiPath(ROUTE_PATHS.SOURCES.WEB_PAGES)]: {
    post: {
      tags: ["Sources"],
      summary: "Add a web page",
      description:
        "Stores the address of a web page as a source with the status stored. The page is not opened or read yet.",
      security,
      parameters: [workspaceIdParameter, knowledgeBaseIdParameter],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWebPageSourceRequest" } } },
      },
      responses: {
        "201": success("The new source", "SourceResponse"),
        "400": failure(
          "Invalid request, for example a missing address, an address that is not http or https, an address with a user name or password, an address over 2048 characters, a malformed id, or a body that is not valid JSON",
        ),
        "401": notSignedIn,
        "404": knowledgeBaseNotFound,
        "500": unexpected,
      },
    },
  },
  [toOpenApiPath(ROUTE_PATHS.SOURCES.FILES)]: {
    post: {
      tags: ["Sources"],
      summary: "Upload a file",
      description:
        "Stores a PDF or a text file (TXT, Markdown, CSV, JSON or HTML) in object storage as a source with the status stored. " +
        "The type is taken from the file extension and the content is checked against it. The file is not read or processed yet.",
      security,
      parameters: [workspaceIdParameter, knowledgeBaseIdParameter],
      requestBody: {
        required: true,
        content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/UploadFileSourceRequest" } } },
      },
      responses: {
        "201": success("The new source", "SourceResponse"),
        "400": failure(
          "Invalid request, for example no file, more than one file, extra form fields, an empty file, an unsupported file type, content that does not match the file type, or a malformed id",
        ),
        "401": notSignedIn,
        "404": knowledgeBaseNotFound,
        "413": failure("The file is larger than the size limit"),
        "500": unexpected,
      },
    },
  },
  [toOpenApiPath(ROUTE_PATHS.SOURCES.BY_ID)]: {
    delete: {
      tags: ["Sources"],
      summary: "Delete a source",
      description: "Permanently deletes a source and, for a file, its stored copy. This cannot be undone.",
      security,
      parameters: [workspaceIdParameter, knowledgeBaseIdParameter, idParameter],
      responses: {
        "200": success("The id of the deleted source", "DeleteSourceResponse"),
        "400": failure("A malformed id"),
        "401": notSignedIn,
        "404": sourceNotFound,
        "500": unexpected,
      },
    },
  },
};
