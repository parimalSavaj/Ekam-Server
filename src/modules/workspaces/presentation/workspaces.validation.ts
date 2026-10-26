import { z } from "zod";

// Messages are returned to the client as-is, so they are written for people.
const workspaceName = z
  .string({ error: "Enter a workspace name." })
  .trim()
  .min(1, "Enter a workspace name.")
  .max(100, "Workspace name must be 100 characters or fewer.");

const workspaceIdParams = z.object({
  id: z.uuid({ error: "Workspace id is not valid." }),
});

export const createWorkspaceBodySchema = z.object(
  { name: workspaceName },
  { error: "Request body must be a JSON object with a workspace name." },
);

export const updateWorkspaceBodySchema = z.object(
  { name: workspaceName },
  { error: "Request body must be a JSON object with a workspace name." },
);

export const getWorkspaceParamsSchema = workspaceIdParams;
export const updateWorkspaceParamsSchema = workspaceIdParams;
export const deleteWorkspaceParamsSchema = workspaceIdParams;
