export const healthSchemas: Record<string, Record<string, unknown>> = {
  HealthResponse: {
    type: "object",
    required: ["status"],
    properties: { status: { type: "string", enum: ["ok"], example: "ok" } },
  },
};
