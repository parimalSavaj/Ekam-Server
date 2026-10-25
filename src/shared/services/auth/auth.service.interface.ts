import type { RequestHandler } from "express";
import type { AuthSession } from "../../../infrastructure/auth/create-auth.js";

export interface IAuthService {
  readonly handler: RequestHandler;
  getSession(headers: Headers): Promise<AuthSession | null>;
}
