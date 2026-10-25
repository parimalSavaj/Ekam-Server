import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import type pg from "pg";
import { config } from "../../shared/config/index.js";
import { ROUTE_PATHS } from "../../shared/constants/route-path.constants.js";
import type { ILoggerService } from "../../shared/services/logger/logger.service.interface.js";

export function createAuth(pool: pg.Pool, logger: ILoggerService) {
  return betterAuth({
    appName: "Ekam",
    baseURL: config.auth.baseURL,
    basePath: ROUTE_PATHS.AUTH.BASE,
    secret: config.auth.secret,
    database: pool,
    trustedOrigins: [config.auth.clientURL],
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: config.auth.googleClientId,
        clientSecret: config.auth.googleClientSecret,
        prompt: "select_account",
      },
    },
    account: {
      modelName: "accounts",
      accountLinking: { enabled: false },
      encryptOAuthTokens: true,
      storeStateStrategy: "database",
      fields: {
        userId: "user_id", accountId: "account_id", providerId: "provider_id",
        accessToken: "access_token", refreshToken: "refresh_token", idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at", refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at", updatedAt: "updated_at",
      },
    },
    user: {
      modelName: "users",
      changeEmail: { enabled: false },
      deleteUser: { enabled: true },
      fields: { emailVerified: "email_verified", createdAt: "created_at", updatedAt: "updated_at" },
    },
    session: {
      modelName: "sessions",
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 5,
      cookieCache: { enabled: false },
      fields: {
        userId: "user_id", expiresAt: "expires_at", ipAddress: "ip_address",
        userAgent: "user_agent", createdAt: "created_at", updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "verifications",
      fields: { expiresAt: "expires_at", createdAt: "created_at", updatedAt: "updated_at" },
    },
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      database: { generateId: () => randomUUID() },
      useSecureCookies: !config.isDevelopment && config.auth.baseURL.startsWith("https://"),
    },
    rateLimit: { enabled: true, window: 60, max: 60, customRules: {
      "/sign-in/social": { window: 60, max: 10 },
    } },
    disabledPaths: [
      "/sign-in/email", "/sign-up/email", "/request-password-reset", "/reset-password",
      "/change-password", "/set-password", "/change-email", "/send-verification-email",
      "/verify-email", "/link-social", "/unlink-account", "/get-access-token",
      "/refresh-token", "/account-info", "/delete-user/callback",
    ],
    plugins: [openAPI({ disableDefaultReference: !config.isDevelopment })],
    onAPIError: { errorURL: `${config.auth.clientURL}/login` },
    logger: {
      level: "warn",
      // Never pass library arguments: OAuth payloads can include credentials/tokens.
      log: (level) => logger.info("Authentication library event", { level }),
    },
  });
}

export type EkamAuth = ReturnType<typeof createAuth>;
export type AuthSession = EkamAuth["$Infer"]["Session"];
