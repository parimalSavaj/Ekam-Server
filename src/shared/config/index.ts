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

const requiredText = z.string().trim().min(1);
const port = z.coerce.number().int().min(1).max(65535);
const positiveInt = z.coerce.number().int().positive();
const origin = z.url({ protocol: /^https?$/ }).refine(value => {
  const url = new URL(value);
  return url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
}, "Must be an HTTP(S) origin without a path");

// Docker Compose passes unset variables as empty strings; treat those as not set.
const optionalEnv = <T extends z.ZodType>(schema: T) =>
  z.preprocess(value => (value === "" ? undefined : value), schema.optional());

// sslmode values that do not encrypt the connection (or only do so when the server asks for it).
const INSECURE_SSL_MODES = new Set(["disable", "allow", "prefer"]);

const envSchema = z.object({
  HOST: requiredText,
  PORT: port,
  NODE_ENV: z.enum(["development", "test", "production"]),
  BETTER_AUTH_URL: origin,
  CLIENT_URL: origin,
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: requiredText,
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  MIGRATION_DATABASE_URL: optionalEnv(z.url({ protocol: /^postgres(ql)?$/ })),

  // Database: set DATABASE_URL (hosted PostgreSQL such as Neon) or all five DB_* values (local Docker).
  DATABASE_URL: optionalEnv(z.url({ protocol: /^postgres(ql)?$/ })),
  DB_HOST: optionalEnv(requiredText),
  DB_PORT: optionalEnv(port),
  DB_USER: optionalEnv(requiredText),
  DB_PASSWORD: optionalEnv(z.string().min(1)),
  DB_NAME: optionalEnv(requiredText),

  // Connection pool tuning. These are not secrets, so they have safe defaults.
  DB_POOL_MAX: positiveInt.default(10),
  DB_CONNECTION_TIMEOUT_MS: positiveInt.default(10_000),
  DB_IDLE_TIMEOUT_MS: positiveInt.default(30_000),
  DB_STATEMENT_TIMEOUT_MS: positiveInt.default(30_000),

  // Object storage for uploaded source files: Amazon S3 in production, MinIO in development.
  // S3_ENDPOINT is only for S3-compatible servers such as MinIO; leave it unset for Amazon S3.
  S3_BUCKET: requiredText,
  S3_REGION: requiredText,
  S3_ACCESS_KEY_ID: requiredText,
  S3_SECRET_ACCESS_KEY: requiredText,
  S3_ENDPOINT: optionalEnv(z.url({ protocol: /^https?$/ })),

  // Largest accepted source file, in megabytes. Not a secret, so it has a default.
  UPLOAD_MAX_FILE_MB: positiveInt.default(20),
});

type Env = z.infer<typeof envSchema>;

function buildLocalConnectionString(
  host: string,
  port: number,
  user: string,
  password: string,
  name: string,
): string {
  const credentials = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  return `postgresql://${credentials}@${host}:${port}/${encodeURIComponent(name)}`;
}

// Resolves the two supported database setups into one connection string.
const configSchema = envSchema.transform((env: Env, ctx) => {
  const { DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = env;
  const parts = { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME };
  const setParts = Object.entries(parts).filter(([, value]) => value !== undefined);
  if (env.NODE_ENV === "production") {
    if (![env.BETTER_AUTH_URL, env.CLIENT_URL].every(value => value.startsWith("https://"))) {
      ctx.issues.push({ code: "custom", message: "BETTER_AUTH_URL and CLIENT_URL require HTTPS in production", input: env });
      return z.NEVER;
    }
    if (env.MIGRATION_DATABASE_URL) {
      const mode = new URL(env.MIGRATION_DATABASE_URL).searchParams.get("sslmode");
      if (!mode || INSECURE_SSL_MODES.has(mode)) {
        ctx.issues.push({ code: "custom", message: "MIGRATION_DATABASE_URL requires TLS in production", input: env });
        return z.NEVER;
      }
    }
  }

  if (DATABASE_URL !== undefined) {
    if (setParts.length > 0) {
      ctx.issues.push({
        code: "custom",
        message: "DATABASE_URL: set either DATABASE_URL or the DB_* variables, not both",
        input: env,
      });
      return z.NEVER;
    }

    // A hosted database must never be reached without TLS in production.
    const sslMode = new URL(DATABASE_URL).searchParams.get("sslmode");
    if (env.NODE_ENV === "production" && (sslMode === null || INSECURE_SSL_MODES.has(sslMode))) {
      ctx.issues.push({
        code: "custom",
        message: "DATABASE_URL: production requires sslmode=require (or verify-ca / verify-full) in the URL",
        input: env,
      });
      return z.NEVER;
    }

    return { ...env, connectionString: DATABASE_URL };
  }

  if (
    DB_HOST === undefined ||
    DB_PORT === undefined ||
    DB_USER === undefined ||
    DB_PASSWORD === undefined ||
    DB_NAME === undefined
  ) {
    const missing = Object.entries(parts)
      .filter(([, value]) => value === undefined)
      .map(([key]) => key);
    ctx.issues.push({
      code: "custom",
      message: `Database: set DATABASE_URL, or all of DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (missing: ${missing.join(", ")})`,
      input: env,
    });
    return z.NEVER;
  }

  return {
    ...env,
    connectionString: buildLocalConnectionString(DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME),
  };
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  // Messages name the variables only; values are never included.
  const issues = parsed.error.issues.map(issue => {
    const path = issue.path.join(".");
    return path === "" ? issue.message : `${path}: ${issue.message}`;
  });
  throw new Error(`Invalid server configuration - ${issues.join("; ")}`);
}

export const config = {
  host: parsed.data.HOST,
  port: parsed.data.PORT,
  isDevelopment: parsed.data.NODE_ENV === "development",
  auth: {
    baseURL: new URL(parsed.data.BETTER_AUTH_URL).origin,
    clientURL: new URL(parsed.data.CLIENT_URL).origin,
    secret: parsed.data.BETTER_AUTH_SECRET,
    googleClientId: parsed.data.GOOGLE_CLIENT_ID,
    googleClientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
  },
  database: {
    connectionString: parsed.data.connectionString,
    migrationConnectionString: parsed.data.MIGRATION_DATABASE_URL ?? parsed.data.connectionString,
    poolMax: parsed.data.DB_POOL_MAX,
    connectionTimeoutMs: parsed.data.DB_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: parsed.data.DB_IDLE_TIMEOUT_MS,
    statementTimeoutMs: parsed.data.DB_STATEMENT_TIMEOUT_MS,
  },
  storage: {
    bucket: parsed.data.S3_BUCKET,
    region: parsed.data.S3_REGION,
    accessKeyId: parsed.data.S3_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.S3_SECRET_ACCESS_KEY,
    endpoint: parsed.data.S3_ENDPOINT,
    // S3-compatible servers such as MinIO are addressed as host/bucket/key.
    forcePathStyle: parsed.data.S3_ENDPOINT !== undefined,
  },
  uploads: {
    maxFileBytes: parsed.data.UPLOAD_MAX_FILE_MB * 1024 * 1024,
  },
} as const;
