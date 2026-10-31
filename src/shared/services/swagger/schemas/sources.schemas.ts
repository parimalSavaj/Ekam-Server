export const sourcesSchemas: Record<string, Record<string, unknown>> = {
  // Shared by the create and upload responses and by each item of the list response.
  SourceResponse: {
    type: "object",
    required: ["id", "knowledgeBaseId", "type", "name", "url", "sizeBytes", "contentType", "status", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid", example: "0192f5a1-7c3e-7d4b-8a21-5e6f7a8b9c0d" },
      knowledgeBaseId: { type: "string", format: "uuid", example: "0192f5a0-1b2c-7d4b-8a21-5e6f7a8b9c0d" },
      type: { type: "string", enum: ["pdf", "web_page", "text_file"], example: "pdf" },
      name: {
        type: "string",
        description: "The file name for files, the web address for web pages.",
        example: "employee-handbook.pdf",
      },
      url: {
        type: "string",
        format: "uri",
        nullable: true,
        description: "Web pages only; null for files.",
        example: null,
      },
      sizeBytes: { type: "integer", nullable: true, description: "Files only; null for web pages.", example: 482113 },
      contentType: { type: "string", nullable: true, description: "Files only; null for web pages.", example: "application/pdf" },
      status: {
        type: "string",
        enum: ["stored", "processing", "ready", "failed"],
        description: "Sources are only stored for now, so every source has the status stored.",
        example: "stored",
      },
      createdAt: { type: "string", format: "date-time", example: "2026-10-31T09:30:00.000Z" },
      updatedAt: { type: "string", format: "date-time", example: "2026-10-31T09:30:00.000Z" },
    },
  },
  ListSourcesResponse: {
    type: "object",
    required: ["sources"],
    properties: {
      sources: { type: "array", items: { $ref: "#/components/schemas/SourceResponse" } },
    },
  },
  CreateWebPageSourceRequest: {
    type: "object",
    required: ["url"],
    properties: {
      url: {
        type: "string",
        format: "uri",
        maxLength: 2048,
        description: "An http or https address. It is stored as given (normalized) and not opened yet.",
        example: "https://example.com/docs/getting-started",
      },
    },
  },
  UploadFileSourceRequest: {
    type: "object",
    required: ["file"],
    properties: {
      file: {
        type: "string",
        format: "binary",
        description: "One PDF, TXT, Markdown, CSV, JSON or HTML file, up to the configured size limit (20 MB by default).",
      },
    },
  },
  DeleteSourceResponse: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", example: "0192f5a1-7c3e-7d4b-8a21-5e6f7a8b9c0d" },
    },
  },
};
