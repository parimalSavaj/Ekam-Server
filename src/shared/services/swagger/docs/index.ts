import { healthDocs } from "./health.docs.js";
import { knowledgeBasesDocs } from "./knowledge-bases.docs.js";
import { sourcesDocs } from "./sources.docs.js";
import { workspacesDocs } from "./workspaces.docs.js";

export const swaggerPaths: Record<string, Record<string, unknown>> = {
  ...healthDocs,
  ...knowledgeBasesDocs,
  ...sourcesDocs,
  ...workspacesDocs,
};
