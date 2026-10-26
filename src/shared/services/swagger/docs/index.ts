import { healthDocs } from "./health.docs.js";
import { workspacesDocs } from "./workspaces.docs.js";

export const swaggerPaths: Record<string, Record<string, unknown>> = {
  ...healthDocs,
  ...workspacesDocs,
};
