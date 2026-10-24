import { healthDocs } from "./health.docs.js";

export const swaggerPaths: Record<string, Record<string, unknown>> = {
  ...healthDocs,
};
