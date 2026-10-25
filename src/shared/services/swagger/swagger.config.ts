import { swaggerPaths } from "./docs/index.js";
import { swaggerSchemas } from "./swagger.schemas.js";
import { ROUTE_PATHS } from "../../constants/route-path.constants.js";

// Static OpenAPI contract; a documentation HTTP route is not needed yet.
export const swaggerConfig = {
  openapi: "3.0.0",
  info: { title: "Ekam Server API", version: "0.1.0", description: "Google-only login uses Better Auth session cookies. Authentication endpoints have their own generated OpenAPI contract." },
  externalDocs: { description: "Better Auth live API schema (Google login, profile, sessions and deletion)", url: ROUTE_PATHS.AUTH.SCHEMA },
  servers: [{ url: "/" }],
  paths: swaggerPaths,
  components: { schemas: swaggerSchemas },
};
