import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";
import type { IAuthService } from "../services/auth/auth.service.interface.js";

export class AuthMiddleware {
  static requireSession(auth: IAuthService): RequestHandler {
    return async (req, res, next) => {
      try {
        const session = await auth.getSession(fromNodeHeaders(req.headers));
        if (!session) {
          res.status(401).json({ message: "Authentication required" });
          return;
        }
        res.locals.auth = session;
        next();
      } catch (error) { next(error); }
    };
  }
}
