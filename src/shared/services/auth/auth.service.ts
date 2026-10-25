import { toNodeHandler } from "better-auth/node";
import type { RequestHandler } from "express";
import type pg from "pg";
import { createAuth, type EkamAuth } from "../../../infrastructure/auth/create-auth.js";
import type { ILoggerService } from "../logger/logger.service.interface.js";
import type { IAuthService } from "./auth.service.interface.js";

export class AuthService implements IAuthService {
  private static instance: AuthService | undefined;
  private readonly auth: EkamAuth;
  readonly handler: RequestHandler;

  private constructor(pool: pg.Pool, logger: ILoggerService) {
    this.auth = createAuth(pool, logger);
    this.handler = toNodeHandler(this.auth);
  }

  static getInstance(pool: pg.Pool, logger: ILoggerService): AuthService {
    return (this.instance ??= new AuthService(pool, logger));
  }

  getSession(headers: Headers) {
    return this.auth.api.getSession({ headers });
  }
}
