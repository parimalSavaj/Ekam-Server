import { z } from "zod";

// Messages are returned to the client as-is, so they are written for people.
const knowledgeBaseName = z
  .string({ error: "Enter a knowledge base name." })
  .trim()
  .min(1, "Enter a knowledge base name.")
  .max(100, "Knowledge base name must be 100 characters or fewer.");

// An empty description is stored as no description.
const knowledgeBaseDescription = z
  .string({ error: "Description must be text." })
  .trim()
  .max(500, "Description must be 500 characters or fewer.")
  .nullable()
  .transform(value => (value === "" ? null : value));

const workspaceParams = z.object({
  workspaceId: z.uuid({ error: "Workspace id is not valid." }),
});

const knowledgeBaseParams = z.object({
  workspaceId: z.uuid({ error: "Workspace id is not valid." }),
  id: z.uuid({ error: "Knowledge base id is not valid." }),
});

const bodyError = "Request body must be a JSON object.";

export const createKnowledgeBaseParamsSchema = workspaceParams;
export const listKnowledgeBasesParamsSchema = workspaceParams;
export const getKnowledgeBaseParamsSchema = knowledgeBaseParams;
export const updateKnowledgeBaseParamsSchema = knowledgeBaseParams;
export const deleteKnowledgeBaseParamsSchema = knowledgeBaseParams;

export const createKnowledgeBaseBodySchema = z.object(
  { name: knowledgeBaseName, description: knowledgeBaseDescription.optional() },
  { error: "Request body must be a JSON object with a knowledge base name." },
);

export const updateKnowledgeBaseBodySchema = z
  .object(
    { name: knowledgeBaseName.optional(), description: knowledgeBaseDescription.optional() },
    { error: bodyError },
  )
  .refine(body => body.name !== undefined || body.description !== undefined, {
    error: "Provide a name or a description to update.",
  });
