import { swaggerPaths } from "./docs/index.js";
import { swaggerSchemas } from "./swagger.schemas.js";

// Static OpenAPI contract; a documentation HTTP route is not needed yet.
export const swaggerConfig = {
  openapi: "3.0.0",
  info: { title: "Ekam Server API", version: "0.1.0" },
  servers: [{ url: "/" }],
  paths: swaggerPaths,
  components: { schemas: swaggerSchemas },
};
