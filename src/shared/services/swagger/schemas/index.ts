import { healthSchemas } from "./health.schemas.js";

export const featureSchemas: Record<string, Record<string, unknown>> = {
  ...healthSchemas,
};
