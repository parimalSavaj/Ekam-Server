import { healthSchemas } from "./health.schemas.js";
import { knowledgeBasesSchemas } from "./knowledge-bases.schemas.js";
import { sourcesSchemas } from "./sources.schemas.js";
import { workspacesSchemas } from "./workspaces.schemas.js";

export const featureSchemas: Record<string, Record<string, unknown>> = {
  ...healthSchemas,
  ...knowledgeBasesSchemas,
  ...sourcesSchemas,
  ...workspacesSchemas,
};
