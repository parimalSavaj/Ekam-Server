import { Router } from "express";
import { ROUTE_PATHS } from "../../../shared/constants/route-path.constants.js";
import type { IAuthService } from "../../../shared/services/auth/auth.service.interface.js";

/** Better Auth owns protocol validation, response bodies, cookies and callbacks. */
export class AuthRoutes {
  private readonly router = Router();

  constructor(auth: IAuthService) {
    this.router.use(ROUTE_PATHS.AUTH.BASE, (_req, res, next) => {
      res.setHeader("Cache-Control", "no-store");
      next();
    });
    this.router.all(ROUTE_PATHS.AUTH.HANDLER, auth.handler);
  }

  getRouter(): Router { return this.router; }
}
