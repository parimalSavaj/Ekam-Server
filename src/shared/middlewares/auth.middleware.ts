import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";
import { UnauthorizedError } from "../core/api-error.js";
import type { IAuthService } from "../services/auth/auth.service.interface.js";

export class AuthMiddleware {
  static requireSession(auth: IAuthService): RequestHandler {
    return async (req, res, next) => {
      try {
        const session = await auth.getSession(fromNodeHeaders(req.headers));
        if (!session) {
          next(new UnauthorizedError());
          return;
        }
        res.locals.auth = session;
        req.user = { userId: session.user.id };
        next();
      } catch (error) { next(error); }
    };
  }
}
