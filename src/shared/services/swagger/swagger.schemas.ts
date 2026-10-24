import { featureSchemas } from "./schemas/index.js";

export const swaggerSchemas: Record<string, Record<string, unknown>> = {
  ApiResponse: {
    type: "object",
    required: ["statusCode", "data"],
    properties: {
      statusCode: { type: "integer", example: 200 },
      data: { type: "object", example: { status: "ok" } },
    },
  },
  ApiError: {
    type: "object",
    required: ["statusCode", "message"],
    properties: {
      statusCode: { type: "integer", example: 500 },
      message: { type: "string", example: "Internal server error" },
    },
  },
  ...featureSchemas,
};
