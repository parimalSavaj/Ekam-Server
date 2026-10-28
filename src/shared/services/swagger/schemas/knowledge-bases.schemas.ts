export const knowledgeBasesSchemas: Record<string, Record<string, unknown>> = {
  // Shared by the create, get and update responses and by each item of the list response.
  KnowledgeBaseResponse: {
    type: "object",
    required: ["id", "workspaceId", "name", "description", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid", example: "0192f5a1-7c3e-7d4b-8a21-5e6f7a8b9c0d" },
      workspaceId: { type: "string", format: "uuid", example: "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b" },
      name: { type: "string", maxLength: 100, example: "Product handbook" },
      description: {
        type: "string",
        nullable: true,
        maxLength: 500,
        example: "Policies, onboarding guides and FAQs for the product team.",
      },
      createdAt: { type: "string", format: "date-time", example: "2026-10-27T09:30:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-10-27T09:30:00.000Z" },
    },
  },
  CreateKnowledgeBaseRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, example: "Product handbook" },
      description: {
        type: "string",
        nullable: true,
        maxLength: 500,
        example: "Policies, onboarding guides and FAQs for the product team.",
      },
    },
  },
  UpdateKnowledgeBaseRequest: {
    type: "object",
    description: "At least one field is required. A field that is left out stays unchanged; an empty or null description clears it.",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, example: "Support playbook" },
      description: {
        type: "string",
        nullable: true,
        maxLength: 500,
        example: "Answers to the questions customers ask most.",
      },
    },
  },
  ListKnowledgeBasesResponse: {
    type: "object",
    required: ["knowledgeBases"],
    properties: {
      knowledgeBases: { type: "array", items: { $ref: "#/components/schemas/KnowledgeBaseResponse" } },
    },
  },
  DeleteKnowledgeBaseResponse: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", example: "0192f5a1-7c3e-7d4b-8a21-5e6f7a8b9c0d" },
    },
  },
};
