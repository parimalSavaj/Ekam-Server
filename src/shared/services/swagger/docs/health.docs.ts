import { ROUTE_PATHS } from "../../../constants/route-path.constants.js";

export const healthDocs: Record<string, Record<string, unknown>> = {
  [ROUTE_PATHS.SYSTEM.HEALTH]: {
    get: {
      tags: ["System"],
      summary: "Check server liveness",
      description: "Confirms that the HTTP server is responding. Does not check database or external service readiness.",
      security: [],
      responses: {
        "500": {
          description: "Unexpected server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        "200": {
          description: "Server is running",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  { type: "object", properties: { data: { $ref: "#/components/schemas/HealthResponse" } } },
                ],
              },
              example: { statusCode: 200, data: { status: "ok" } },
            },
          },
        },
      },
    },
  },
};
