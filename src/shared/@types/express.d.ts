import type { AuthenticatedUser } from "../services/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by AuthMiddleware.requireSession(); only present on routes that apply it. */
      user?: AuthenticatedUser;
    }
  }
}
