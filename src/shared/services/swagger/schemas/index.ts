import { healthSchemas } from "./health.schemas.js";
import { workspacesSchemas } from "./workspaces.schemas.js";

export const featureSchemas: Record<string, Record<string, unknown>> = {
  ...healthSchemas,
  ...workspacesSchemas,
};
