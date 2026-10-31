import { z } from "zod";

// Messages are returned to the client as-is, so they are written for people.
const knowledgeBaseParams = z.object({
  workspaceId: z.uuid({ error: "Workspace id is not valid." }),
  knowledgeBaseId: z.uuid({ error: "Knowledge base id is not valid." }),
});

const sourceParams = z.object({
  workspaceId: z.uuid({ error: "Workspace id is not valid." }),
  knowledgeBaseId: z.uuid({ error: "Knowledge base id is not valid." }),
  id: z.uuid({ error: "Source id is not valid." }),
});

const urlError = "Enter a full web address that starts with http:// or https://.";

// The address is only stored at intake, never opened. It is normalized (for example a missing
// path becomes "/") so the same page is always saved the same way.
const webPageUrl = z
  .string({ error: urlError })
  .trim()
  .min(1, urlError)
  .max(2048, "The web address must be 2048 characters or fewer.")
  .transform((value, ctx) => {
    if (!URL.canParse(value)) {
      ctx.addIssue({ code: "custom", message: urlError });
      return z.NEVER;
    }
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      ctx.addIssue({ code: "custom", message: urlError });
      return z.NEVER;
    }
    if (url.username !== "" || url.password !== "") {
      ctx.addIssue({ code: "custom", message: "The web address must not contain a user name or password." });
      return z.NEVER;
    }
    return url.href;
  });

export const listSourcesParamsSchema = knowledgeBaseParams;
export const createWebPageSourceParamsSchema = knowledgeBaseParams;
export const uploadFileSourceParamsSchema = knowledgeBaseParams;
export const deleteSourceParamsSchema = sourceParams;

export const createWebPageSourceBodySchema = z.object(
  { url: webPageUrl },
  { error: "Request body must be a JSON object with a web address." },
);
