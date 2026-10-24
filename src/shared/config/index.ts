import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// Production receives configuration from the deployment environment.
// Local files never override variables already set by the process.
if (process.env.NODE_ENV !== "production") {
  const { error } = dotenv.config({
    path: fileURLToPath(new URL("../../../.env", import.meta.url)),
    override: false,
    quiet: true,
  });

  // A file is optional if all required values are supplied by the process.
  if (error && !("code" in error && String(error.code) === "ENOENT")) {
    throw new Error("Unable to read server-local .env configuration");
  }
}

const envSchema = z.object({
  HOST: z.string().trim().min(1),
  PORT: z.coerce.number().int().min(1).max(65535),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid server configuration - ${issues.join("; ")}`);
}

export const config = {
  host: parsed.data.HOST,
  port: parsed.data.PORT,
  isDevelopment: parsed.data.NODE_ENV === "development",
} as const;
