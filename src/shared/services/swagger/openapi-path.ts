/** Converts an Express route pattern such as "/api/workspaces/:id" to the OpenAPI form "/api/workspaces/{id}". */
export function toOpenApiPath(expressPath: string): string {
  return expressPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}
